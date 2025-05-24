// LabEscrow Smart Contract
// Provides secure, milestone-based escrow services for collaborative research projects,
// grant disbursements, and payments for significant services.

#[lint_allow(coin_field)]
module labshare_dao::lab_escrow {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use sui::event;
    use sui::clock::{Clock};
    use std::string::{String};
    use std::option::{Self, Option};

    // ===== Error Codes =====
    const ENotAuthorized: u64 = 0;
    const EInsufficientFunds: u64 = 2;
    const EInvalidMilestone: u64 = 3;
    const EMilestoneNotSubmitted: u64 = 4;
    const EMilestoneAlreadyPaid: u64 = 5;
    const EEscrowNotActive: u64 = 6;
    const EMilestoneNotApproved: u64 = 7;
    const EInvalidAmount: u64 = 8;

    // ===== Structs =====

    // Status enum for milestones
    public struct MilestoneStatus has copy, drop, store {
        id: u8,
    }

    // Milestone status constants
    public fun pending_status(): MilestoneStatus { MilestoneStatus { id: 0 } }
    public fun submitted_status(): MilestoneStatus { MilestoneStatus { id: 1 } }
    public fun approved_status(): MilestoneStatus { MilestoneStatus { id: 2 } }
    public fun rejected_status(): MilestoneStatus { MilestoneStatus { id: 3 } }
    public fun paid_status(): MilestoneStatus { MilestoneStatus { id: 4 } }

    // Escrow status enum
    public struct EscrowStatus has copy, drop, store {
        id: u8,
    }

    // Escrow status constants
    public fun active_status(): EscrowStatus { EscrowStatus { id: 0 } }
    public fun completed_status(): EscrowStatus { EscrowStatus { id: 1 } }
    public fun disputed_status(): EscrowStatus { EscrowStatus { id: 2 } }
    public fun cancelled_status(): EscrowStatus { EscrowStatus { id: 3 } }

    // Individual milestone
    public struct Milestone has store {
        index: u64,
        description: String,
        amount: u64,
        due_date: u64,
        status: MilestoneStatus,
        proof_link: Option<String>,
        approval_proposal_id: Option<ID>,
    }

    // Main escrow account
    public struct EscrowAccount has key {
        id: UID,
        funder: address,
        beneficiary: address,
        total_amount: u64,
        deposited_amount: u64,
        paid_amount: u64,
        currency_type: String, // For future multi-token support
        status: EscrowStatus,
        milestones: Table<u64, Milestone>,
        milestone_count: u64,
        funds: Coin<SUI>,
        created_at: u64,
        dao_reference: Option<ID>, // Reference to DAO for governance
    }

    // ===== Events =====

    public struct EscrowInitialized has copy, drop {
        escrow_id: ID,
        funder: address,
        beneficiary: address,
        total_amount: u64,
    }

    public struct FundsDeposited has copy, drop {
        escrow_id: ID,
        amount: u64,
        deposited_by: address,
    }

    public struct MilestoneDefined has copy, drop {
        escrow_id: ID,
        milestone_index: u64,
        amount: u64,
        due_date: u64,
    }

    public struct MilestoneSubmitted has copy, drop {
        escrow_id: ID,
        milestone_index: u64,
        submitted_by: address,
        proof_link: String,
    }

    public struct MilestoneApproved has copy, drop {
        escrow_id: ID,
        milestone_index: u64,
        approved_by: address,
    }

    public struct MilestoneRejected has copy, drop {
        escrow_id: ID,
        milestone_index: u64,
        rejected_by: address,
        reason: String,
    }

    public struct MilestonePaymentReleased has copy, drop {
        escrow_id: ID,
        milestone_index: u64,
        amount: u64,
        paid_to: address,
    }

    public struct EscrowDisputed has copy, drop {
        escrow_id: ID,
        milestone_index: Option<u64>,
        disputed_by: address,
        reason: String,
    }

    public struct EscrowCancelled has copy, drop {
        escrow_id: ID,
        cancelled_by: address,
        refund_amount: u64,
    }

    // ===== Core Functions =====

    // Initialize a new escrow account
    public fun initialize_escrow(
        funder: address,
        beneficiary: address,
        total_amount: u64,
        dao_reference: Option<ID>,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        assert!(total_amount > 0, EInvalidAmount);
        assert!(funder != beneficiary, ENotAuthorized);

        let escrow = EscrowAccount {
            id: object::new(ctx),
            funder,
            beneficiary,
            total_amount,
            deposited_amount: 0,
            paid_amount: 0,
            currency_type: std::string::utf8(b"SUI"),
            status: active_status(),
            milestones: table::new(ctx),
            milestone_count: 0,
            funds: coin::zero(ctx),
            created_at: sui::clock::timestamp_ms(clock),
            dao_reference,
        };

        let escrow_id = object::id(&escrow);

        // Emit event
        event::emit(EscrowInitialized {
            escrow_id,
            funder,
            beneficiary,
            total_amount,
        });

        transfer::share_object(escrow);
        escrow_id
    }

    // Deposit funds to escrow
    public fun deposit_funds_to_escrow(
        escrow: &mut EscrowAccount,
        funds: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == escrow.funder, ENotAuthorized);
        assert!(escrow.status.id == 0, EEscrowNotActive); // Active status

        let deposit_amount = coin::value(&funds);
        assert!(deposit_amount > 0, EInvalidAmount);
        assert!(escrow.deposited_amount + deposit_amount <= escrow.total_amount, EInvalidAmount);

        coin::join(&mut escrow.funds, funds);
        escrow.deposited_amount = escrow.deposited_amount + deposit_amount;

        event::emit(FundsDeposited {
            escrow_id: object::id(escrow),
            amount: deposit_amount,
            deposited_by: sender,
        });
    }

    // Define a milestone
    public fun define_milestone(
        escrow: &mut EscrowAccount,
        description: String,
        amount: u64,
        due_date: u64,
        approval_proposal_id: Option<ID>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == escrow.funder, ENotAuthorized);
        assert!(escrow.status.id == 0, EEscrowNotActive); // Active status
        assert!(amount > 0, EInvalidAmount);

        let milestone = Milestone {
            index: escrow.milestone_count,
            description,
            amount,
            due_date,
            status: pending_status(),
            proof_link: option::none(),
            approval_proposal_id,
        };

        table::add(&mut escrow.milestones, escrow.milestone_count, milestone);
        escrow.milestone_count = escrow.milestone_count + 1;

        event::emit(MilestoneDefined {
            escrow_id: object::id(escrow),
            milestone_index: escrow.milestone_count - 1,
            amount,
            due_date,
        });
    }

    // Submit milestone for approval
    public fun submit_milestone_for_approval(
        escrow: &mut EscrowAccount,
        milestone_index: u64,
        proof_link: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == escrow.beneficiary, ENotAuthorized);
        assert!(escrow.status.id == 0, EEscrowNotActive); // Active status
        assert!(table::contains(&escrow.milestones, milestone_index), EInvalidMilestone);

        let milestone = table::borrow_mut(&mut escrow.milestones, milestone_index);
        assert!(milestone.status.id == 0, EMilestoneNotSubmitted); // Pending status

        milestone.status = submitted_status();
        milestone.proof_link = option::some(proof_link);

        event::emit(MilestoneSubmitted {
            escrow_id: object::id(escrow),
            milestone_index,
            submitted_by: sender,
            proof_link,
        });
    }

    // Approve milestone
    public fun approve_milestone(
        escrow: &mut EscrowAccount,
        milestone_index: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == escrow.funder, ENotAuthorized);
        assert!(escrow.status.id == 0, EEscrowNotActive); // Active status
        assert!(table::contains(&escrow.milestones, milestone_index), EInvalidMilestone);

        let milestone = table::borrow_mut(&mut escrow.milestones, milestone_index);
        assert!(milestone.status.id == 1, EMilestoneNotSubmitted); // Submitted status

        milestone.status = approved_status();

        event::emit(MilestoneApproved {
            escrow_id: object::id(escrow),
            milestone_index,
            approved_by: sender,
        });
    }

    // Reject milestone
    public fun reject_milestone(
        escrow: &mut EscrowAccount,
        milestone_index: u64,
        reason: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == escrow.funder, ENotAuthorized);
        assert!(escrow.status.id == 0, EEscrowNotActive); // Active status
        assert!(table::contains(&escrow.milestones, milestone_index), EInvalidMilestone);

        let milestone = table::borrow_mut(&mut escrow.milestones, milestone_index);
        assert!(milestone.status.id == 1, EMilestoneNotSubmitted); // Submitted status

        milestone.status = rejected_status();
        milestone.proof_link = option::none(); // Clear proof link for resubmission

        event::emit(MilestoneRejected {
            escrow_id: object::id(escrow),
            milestone_index,
            rejected_by: sender,
            reason,
        });
    }

    // Release milestone payment
    public fun release_milestone_payment(
        escrow: &mut EscrowAccount,
        milestone_index: u64,
        ctx: &mut TxContext
    ): Coin<SUI> {
        let sender = tx_context::sender(ctx);
        assert!(sender == escrow.funder || sender == escrow.beneficiary, ENotAuthorized);
        assert!(escrow.status.id == 0, EEscrowNotActive); // Active status
        assert!(table::contains(&escrow.milestones, milestone_index), EInvalidMilestone);

        let milestone = table::borrow_mut(&mut escrow.milestones, milestone_index);
        assert!(milestone.status.id == 2, EMilestoneNotApproved); // Approved status
        assert!(coin::value(&escrow.funds) >= milestone.amount, EInsufficientFunds);

        // Extract payment
        let payment_amount = milestone.amount;
        let beneficiary_address = escrow.beneficiary;
        let payment = coin::split(&mut escrow.funds, payment_amount, ctx);
        milestone.status = paid_status();
        escrow.paid_amount = escrow.paid_amount + payment_amount;

        // Store escrow_id before checking milestones
        let escrow_id = object::id(escrow);

        // Check if all milestones are completed
        let mut all_completed = true;
        let mut i = 0;
        while (i < escrow.milestone_count) {
            if (table::contains(&escrow.milestones, i)) {
                let m = table::borrow(&escrow.milestones, i);
                if (m.status.id != 4) { // Not paid
                    all_completed = false;
                    break
                };
            };
            i = i + 1;
        };

        if (all_completed) {
            escrow.status = completed_status();
        };

        event::emit(MilestonePaymentReleased {
            escrow_id,
            milestone_index,
            amount: payment_amount,
            paid_to: beneficiary_address,
        });

        payment
    }

    // Initiate dispute
    public fun initiate_dispute(
        escrow: &mut EscrowAccount,
        milestone_index: Option<u64>,
        reason: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == escrow.funder || sender == escrow.beneficiary, ENotAuthorized);
        assert!(escrow.status.id == 0, EEscrowNotActive); // Active status

        escrow.status = disputed_status();

        event::emit(EscrowDisputed {
            escrow_id: object::id(escrow),
            milestone_index,
            disputed_by: sender,
            reason,
        });
    }

    // Cancel escrow (only if no milestones have been paid)
    public fun cancel_escrow(
        escrow: &mut EscrowAccount,
        ctx: &mut TxContext
    ): Coin<SUI> {
        let sender = tx_context::sender(ctx);
        assert!(sender == escrow.funder, ENotAuthorized);
        assert!(escrow.status.id == 0, EEscrowNotActive); // Active status
        assert!(escrow.paid_amount == 0, EMilestoneAlreadyPaid);

        escrow.status = cancelled_status();
        let refund_amount = coin::value(&escrow.funds);
        let refund = coin::split(&mut escrow.funds, refund_amount, ctx);

        event::emit(EscrowCancelled {
            escrow_id: object::id(escrow),
            cancelled_by: sender,
            refund_amount,
        });

        refund
    }

    // ===== Getter Functions =====

    public fun get_escrow_info(escrow: &EscrowAccount): (ID, address, address, u64, u64, u64, u8, u64) {
        (
            object::id(escrow),
            escrow.funder,
            escrow.beneficiary,
            escrow.total_amount,
            escrow.deposited_amount,
            escrow.paid_amount,
            escrow.status.id,
            escrow.milestone_count
        )
    }

    public fun get_milestone_info(escrow: &EscrowAccount, milestone_index: u64): (String, u64, u64, u8, Option<String>) {
        assert!(table::contains(&escrow.milestones, milestone_index), EInvalidMilestone);
        let milestone = table::borrow(&escrow.milestones, milestone_index);
        (
            milestone.description,
            milestone.amount,
            milestone.due_date,
            milestone.status.id,
            milestone.proof_link
        )
    }

    public fun get_escrow_balance(escrow: &EscrowAccount): u64 {
        coin::value(&escrow.funds)
    }

    public fun is_milestone_completed(escrow: &EscrowAccount, milestone_index: u64): bool {
        if (!table::contains(&escrow.milestones, milestone_index)) {
            return false
        };
        let milestone = table::borrow(&escrow.milestones, milestone_index);
        milestone.status.id == 4 // Paid status
    }
} 