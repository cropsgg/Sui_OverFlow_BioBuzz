// ResearchIncentives Smart Contract
// Facilitates the creation of reward programs for contributions (e.g., datasets, peer reviews)
// and manages automated royalty distributions from commercialized IP.

module labshare_dao::research_incentives {
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
    use std::vector;

    // ===== Error Codes =====
    const ENotAuthorized: u64 = 0;
    const EInvalidRewardPool: u64 = 1;
    const EInvalidContribution: u64 = 2;
    const EInvalidRoyaltyAgreement: u64 = 3;
    const EInsufficientFunds: u64 = 4;
    const EInvalidReward: u64 = 5;
    const EContributionAlreadyRewarded: u64 = 6;
    const EInvalidBeneficiaryShares: u64 = 7;
    const EInvalidAmount: u64 = 8;
    const EContributionNotApproved: u64 = 9;

    // ===== Structs =====

    // Contribution types
    public struct ContributionType has copy, drop, store {
        id: u8,
        name: String,
        description: String,
    }

    // Status for contributions
    public struct ContributionStatus has copy, drop, store {
        id: u8,
    }

    // Contribution status constants
    public fun pending_review_status(): ContributionStatus { ContributionStatus { id: 0 } }
    public fun approved_status(): ContributionStatus { ContributionStatus { id: 1 } }
    public fun rewarded_status(): ContributionStatus { ContributionStatus { id: 2 } }
    public fun rejected_status(): ContributionStatus { ContributionStatus { id: 3 } }

    // Reward pool for incentivizing contributions
    public struct RewardPool has key {
        id: UID,
        pool_id: u64,
        name: String,
        description: String,
        creator: address,
        total_funds: Coin<SUI>,
        distributed_amount: u64,
        currency_type: String,
        criteria: String, // JSON criteria for reward eligibility
        eligible_contribution_types: vector<u8>,
        active: bool,
        created_at: u64,
        dao_reference: Option<ID>, // Reference to DAO for governance
        evaluators: Table<address, bool>, // Addresses authorized to evaluate contributions
    }

    // Individual contribution record
    public struct ContributionReceipt has key {
        id: UID,
        receipt_id: u64,
        contributor: address,
        contribution_type: u8,
        contribution_reference_id: ID, // Reference to DataRecord or other objects
        title: String,
        description: String,
        status: ContributionStatus,
        submitted_at: u64,
        evaluated_at: Option<u64>,
        evaluator: Option<address>,
        reward_amount: Option<u64>,
        pool_reference: Option<ID>,
        metadata: String, // Additional contribution details
    }

    // Royalty split agreement for IP commercialization
    public struct RoyaltySplitAgreement has key {
        id: UID,
        agreement_id: u64,
        ip_reference: String, // Identifier for the intellectual property
        title: String,
        description: String,
        creator: address,
        beneficiaries: Table<address, u16>, // address -> share in basis points (10000 = 100%)
        total_shares: u16, // Sum of all shares (should be <= 10000)
        royalty_funds: Coin<SUI>,
        total_distributed: u64,
        active: bool,
        created_at: u64,
        last_distribution: Option<u64>,
    }

    // Global incentives registry
    public struct IncentivesRegistry has key {
        id: UID,
        admin: address,
        next_pool_id: u64,
        next_receipt_id: u64,
        next_agreement_id: u64,
        contribution_types: vector<ContributionType>,
        active_pools: Table<ID, bool>,
        total_rewards_distributed: u64,
        total_royalties_distributed: u64,
    }

    // ===== Events =====

    public struct IncentivesRegistryInitialized has copy, drop {
        registry_id: ID,
        admin: address,
    }

    public struct RewardPoolCreated has copy, drop {
        registry_id: ID,
        pool_id: ID,
        name: String,
        creator: address,
        initial_amount: u64,
    }

    public struct RewardPoolFunded has copy, drop {
        pool_id: ID,
        funder: address,
        amount: u64,
    }

    public struct ContributionRegistered has copy, drop {
        registry_id: ID,
        receipt_id: ID,
        contributor: address,
        contribution_type: u8,
        contribution_reference_id: ID,
    }

    public struct ContributionEvaluated has copy, drop {
        receipt_id: ID,
        evaluator: address,
        approved: bool,
        reason: Option<String>,
    }

    public struct RewardDistributed has copy, drop {
        pool_id: ID,
        receipt_id: ID,
        contributor: address,
        amount: u64,
    }

    public struct RoyaltySplitAgreementCreated has copy, drop {
        agreement_id: ID,
        ip_reference: String,
        creator: address,
        beneficiaries_count: u64,
    }

    public struct RoyaltiesDeposited has copy, drop {
        agreement_id: ID,
        depositor: address,
        amount: u64,
    }

    public struct RoyaltiesDistributed has copy, drop {
        agreement_id: ID,
        total_distributed: u64,
        beneficiaries_count: u64,
    }

    // ===== Core Functions =====

    // Initialize incentives registry
    public fun initialize_incentives_registry(ctx: &mut TxContext): ID {
        let mut contribution_types = vector::empty<ContributionType>();
        
        // Default contribution types for research
        vector::push_back(&mut contribution_types, ContributionType { 
            id: 0, 
            name: std::string::utf8(b"Dataset Submission"), 
            description: std::string::utf8(b"Original research datasets with proper documentation")
        });
        vector::push_back(&mut contribution_types, ContributionType { 
            id: 1, 
            name: std::string::utf8(b"Peer Review"), 
            description: std::string::utf8(b"Quality peer review of research proposals or papers")
        });
        vector::push_back(&mut contribution_types, ContributionType { 
            id: 2, 
            name: std::string::utf8(b"Code Contribution"), 
            description: std::string::utf8(b"Open source software tools for research")
        });
        vector::push_back(&mut contribution_types, ContributionType { 
            id: 3, 
            name: std::string::utf8(b"Documentation"), 
            description: std::string::utf8(b"Technical documentation and tutorials")
        });
        vector::push_back(&mut contribution_types, ContributionType { 
            id: 4, 
            name: std::string::utf8(b"Replication Study"), 
            description: std::string::utf8(b"Independent replication of published research")
        });

        let registry = IncentivesRegistry {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            next_pool_id: 0,
            next_receipt_id: 0,
            next_agreement_id: 0,
            contribution_types,
            active_pools: table::new(ctx),
            total_rewards_distributed: 0,
            total_royalties_distributed: 0,
        };

        let registry_id = object::id(&registry);

        event::emit(IncentivesRegistryInitialized {
            registry_id,
            admin: tx_context::sender(ctx),
        });

        transfer::share_object(registry);
        registry_id
    }

    // Create a new reward pool
    public fun create_reward_pool(
        registry: &mut IncentivesRegistry,
        name: String,
        description: String,
        criteria: String,
        eligible_contribution_types: vector<u8>,
        initial_funds: Coin<SUI>,
        dao_reference: Option<ID>,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        assert!(coin::value(&initial_funds) > 0, EInvalidAmount);

        let pool = RewardPool {
            id: object::new(ctx),
            pool_id: registry.next_pool_id,
            name,
            description,
            creator: tx_context::sender(ctx),
            total_funds: initial_funds,
            distributed_amount: 0,
            currency_type: std::string::utf8(b"SUI"),
            criteria,
            eligible_contribution_types,
            active: true,
            created_at: sui::clock::timestamp_ms(clock),
            dao_reference,
            evaluators: table::new(ctx),
        };

        let pool_id = object::id(&pool);
        table::add(&mut registry.active_pools, pool_id, true);
        registry.next_pool_id = registry.next_pool_id + 1;

        event::emit(RewardPoolCreated {
            registry_id: object::id(registry),
            pool_id,
            name,
            creator: tx_context::sender(ctx),
            initial_amount: coin::value(&pool.total_funds),
        });

        transfer::share_object(pool);
        pool_id
    }

    // Add funds to an existing reward pool
    public fun fund_reward_pool(
        pool: &mut RewardPool,
        funds: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(pool.active, EInvalidRewardPool);
        assert!(coin::value(&funds) > 0, EInvalidAmount);

        let amount = coin::value(&funds);
        coin::join(&mut pool.total_funds, funds);

        event::emit(RewardPoolFunded {
            pool_id: object::id(pool),
            funder: tx_context::sender(ctx),
            amount,
        });
    }

    // Add evaluator to reward pool
    public fun add_pool_evaluator(
        pool: &mut RewardPool,
        evaluator: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == pool.creator, ENotAuthorized);
        table::add(&mut pool.evaluators, evaluator, true);
    }

    // Register a contribution for evaluation
    public fun register_contribution(
        registry: &mut IncentivesRegistry,
        contribution_type: u8,
        contribution_reference_id: ID,
        title: String,
        description: String,
        metadata: String,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        assert!((contribution_type as u64) < vector::length(&registry.contribution_types), EInvalidContribution);

        let receipt = ContributionReceipt {
            id: object::new(ctx),
            receipt_id: registry.next_receipt_id,
            contributor: tx_context::sender(ctx),
            contribution_type,
            contribution_reference_id,
            title,
            description,
            status: pending_review_status(),
            submitted_at: sui::clock::timestamp_ms(clock),
            evaluated_at: option::none(),
            evaluator: option::none(),
            reward_amount: option::none(),
            pool_reference: option::none(),
            metadata,
        };

        let receipt_id = object::id(&receipt);
        registry.next_receipt_id = registry.next_receipt_id + 1;

        event::emit(ContributionRegistered {
            registry_id: object::id(registry),
            receipt_id,
            contributor: tx_context::sender(ctx),
            contribution_type,
            contribution_reference_id,
        });

        transfer::share_object(receipt);
        receipt_id
    }

    // Evaluate and potentially reward a contribution
    public fun evaluate_and_reward_contribution(
        registry: &mut IncentivesRegistry,
        pool: &mut RewardPool,
        receipt: &mut ContributionReceipt,
        approved: bool,
        reward_amount: u64,
        reason: Option<String>,
        clock: &Clock,
        ctx: &mut TxContext
    ): Option<Coin<SUI>> {
        let sender = tx_context::sender(ctx);
        
        // Check authorization
        assert!(
            sender == pool.creator || 
            table::contains(&pool.evaluators, sender), 
            ENotAuthorized
        );
        
        assert!(receipt.status.id == 0, EContributionAlreadyRewarded); // Pending review
        assert!(pool.active, EInvalidRewardPool);

        // Check if contribution type is eligible for this pool
        let mut type_eligible = false;
        let len = vector::length(&pool.eligible_contribution_types);
        let mut i = 0;
        while (i < len) {
            if (*vector::borrow(&pool.eligible_contribution_types, i) == receipt.contribution_type) {
                type_eligible = true;
                break
            };
            i = i + 1;
        };
        assert!(type_eligible, EInvalidContribution);

        // Update receipt
        receipt.evaluated_at = option::some(sui::clock::timestamp_ms(clock));
        receipt.evaluator = option::some(sender);

        if (approved && reward_amount > 0) {
            assert!(coin::value(&pool.total_funds) >= reward_amount, EInsufficientFunds);
            
            receipt.status = rewarded_status();
            receipt.reward_amount = option::some(reward_amount);
            receipt.pool_reference = option::some(object::id(pool));

            // Extract reward from pool
            let reward = coin::split(&mut pool.total_funds, reward_amount, ctx);
            pool.distributed_amount = pool.distributed_amount + reward_amount;
            registry.total_rewards_distributed = registry.total_rewards_distributed + reward_amount;

            event::emit(ContributionEvaluated {
                receipt_id: object::id(receipt),
                evaluator: sender,
                approved: true,
                reason,
            });

            event::emit(RewardDistributed {
                pool_id: object::id(pool),
                receipt_id: object::id(receipt),
                contributor: receipt.contributor,
                amount: reward_amount,
            });

            option::some(reward)
        } else {
            receipt.status = if (approved) approved_status() else rejected_status();

            event::emit(ContributionEvaluated {
                receipt_id: object::id(receipt),
                evaluator: sender,
                approved,
                reason,
            });

            option::none()
        }
    }

    // Setup royalty split agreement
    public fun setup_royalty_agreement(
        registry: &mut IncentivesRegistry,
        ip_reference: String,
        title: String,
        description: String,
        beneficiaries: vector<address>,
        shares_bps: vector<u16>, // Shares in basis points
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        assert!(vector::length(&beneficiaries) == vector::length(&shares_bps), EInvalidBeneficiaryShares);
        assert!(vector::length(&beneficiaries) > 0, EInvalidBeneficiaryShares);

        // Calculate total shares and validate
        let mut total_shares: u16 = 0;
        let mut i = 0;
        while (i < vector::length(&shares_bps)) {
            let share = *vector::borrow(&shares_bps, i);
            assert!(share > 0 && share <= 10000, EInvalidBeneficiaryShares); // Max 100%
            total_shares = total_shares + share;
            i = i + 1;
        };
        assert!(total_shares <= 10000, EInvalidBeneficiaryShares); // Total can't exceed 100%

        let mut beneficiary_table = table::new(ctx);
        i = 0;
        while (i < vector::length(&beneficiaries)) {
            let addr = *vector::borrow(&beneficiaries, i);
            let share = *vector::borrow(&shares_bps, i);
            table::add(&mut beneficiary_table, addr, share);
            i = i + 1;
        };

        let agreement = RoyaltySplitAgreement {
            id: object::new(ctx),
            agreement_id: registry.next_agreement_id,
            ip_reference,
            title,
            description,
            creator: tx_context::sender(ctx),
            beneficiaries: beneficiary_table,
            total_shares,
            royalty_funds: coin::zero(ctx),
            total_distributed: 0,
            active: true,
            created_at: sui::clock::timestamp_ms(clock),
            last_distribution: option::none(),
        };

        let agreement_id = object::id(&agreement);
        registry.next_agreement_id = registry.next_agreement_id + 1;

        event::emit(RoyaltySplitAgreementCreated {
            agreement_id,
            ip_reference,
            creator: tx_context::sender(ctx),
            beneficiaries_count: vector::length(&beneficiaries),
        });

        transfer::share_object(agreement);
        agreement_id
    }

    // Deposit royalties to agreement
    public fun deposit_royalties(
        agreement: &mut RoyaltySplitAgreement,
        incoming_royalties: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(agreement.active, EInvalidRoyaltyAgreement);
        assert!(coin::value(&incoming_royalties) > 0, EInvalidAmount);

        let amount = coin::value(&incoming_royalties);
        coin::join(&mut agreement.royalty_funds, incoming_royalties);

        event::emit(RoyaltiesDeposited {
            agreement_id: object::id(agreement),
            depositor: tx_context::sender(ctx),
            amount,
        });
    }

    // Distribute royalties to beneficiaries
    public fun distribute_royalties_from_agreement(
        registry: &mut IncentivesRegistry,
        agreement: &mut RoyaltySplitAgreement,
        clock: &Clock,
        ctx: &mut TxContext
    ): vector<Coin<SUI>> {
        assert!(agreement.active, EInvalidRoyaltyAgreement);
        
        let total_available = coin::value(&agreement.royalty_funds);
        assert!(total_available > 0, EInsufficientFunds);

        let mut payments = vector::empty<Coin<SUI>>();
        let mut distributed_this_round = 0;

        // Create a temporary vector to iterate over beneficiaries
        let mut beneficiary_addresses = vector::empty<address>();
        let mut beneficiary_shares = vector::empty<u16>();
        
        // Note: In a production environment, you'd want a more efficient way to iterate over table entries
        // For now, this assumes beneficiaries are tracked separately or retrieved differently

        // For demonstration, we'll distribute the entire amount proportionally
        // In practice, you'd iterate through the beneficiaries table properly
        
        let total_to_distribute = total_available;
        
        // Extract all funds for distribution
        let distribution_funds = coin::split(&mut agreement.royalty_funds, total_to_distribute, ctx);
        
        // Add back to payments for individual distribution (simplified for demo)
        vector::push_back(&mut payments, distribution_funds);
        
        distributed_this_round = total_to_distribute;
        agreement.total_distributed = agreement.total_distributed + distributed_this_round;
        agreement.last_distribution = option::some(sui::clock::timestamp_ms(clock));
        
        registry.total_royalties_distributed = registry.total_royalties_distributed + distributed_this_round;

        event::emit(RoyaltiesDistributed {
            agreement_id: object::id(agreement),
            total_distributed: distributed_this_round,
            beneficiaries_count: 1, // Simplified for demo
        });

        payments
    }

    // ===== Admin Functions =====

    // Deactivate reward pool
    public fun deactivate_reward_pool(
        registry: &mut IncentivesRegistry,
        pool: &mut RewardPool,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == pool.creator || tx_context::sender(ctx) == registry.admin, ENotAuthorized);
        pool.active = false;
        
        let pool_id = object::id(pool);
        if (table::contains(&registry.active_pools, pool_id)) {
            *table::borrow_mut(&mut registry.active_pools, pool_id) = false;
        };
    }

    // Deactivate royalty agreement
    public fun deactivate_royalty_agreement(
        agreement: &mut RoyaltySplitAgreement,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == agreement.creator, ENotAuthorized);
        agreement.active = false;
    }

    // Withdraw remaining funds from reward pool (creator only)
    public fun withdraw_pool_funds(
        pool: &mut RewardPool,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<SUI> {
        assert!(tx_context::sender(ctx) == pool.creator, ENotAuthorized);
        assert!(coin::value(&pool.total_funds) >= amount, EInsufficientFunds);
        coin::split(&mut pool.total_funds, amount, ctx)
    }

    // ===== Getter Functions =====

    public fun get_registry_info(registry: &IncentivesRegistry): (ID, address, u64, u64, u64, u64, u64) {
        (
            object::id(registry),
            registry.admin,
            registry.next_pool_id,
            registry.next_receipt_id,
            registry.next_agreement_id,
            registry.total_rewards_distributed,
            registry.total_royalties_distributed
        )
    }

    public fun get_reward_pool_info(pool: &RewardPool): (ID, String, address, u64, u64, bool, u64) {
        (
            object::id(pool),
            pool.name,
            pool.creator,
            coin::value(&pool.total_funds),
            pool.distributed_amount,
            pool.active,
            pool.created_at
        )
    }

    public fun get_contribution_info(receipt: &ContributionReceipt): (ID, address, u8, ID, String, u8, Option<u64>) {
        (
            object::id(receipt),
            receipt.contributor,
            receipt.contribution_type,
            receipt.contribution_reference_id,
            receipt.title,
            receipt.status.id,
            receipt.reward_amount
        )
    }

    public fun get_royalty_agreement_info(agreement: &RoyaltySplitAgreement): (ID, String, address, u16, u64, u64, bool) {
        (
            object::id(agreement),
            agreement.ip_reference,
            agreement.creator,
            agreement.total_shares,
            coin::value(&agreement.royalty_funds),
            agreement.total_distributed,
            agreement.active
        )
    }

    public fun is_pool_evaluator(pool: &RewardPool, addr: address): bool {
        table::contains(&pool.evaluators, addr)
    }

    public fun get_contribution_type_info(registry: &IncentivesRegistry, type_id: u8): (String, String) {
        assert!((type_id as u64) < vector::length(&registry.contribution_types), EInvalidContribution);
        let contrib_type = vector::borrow(&registry.contribution_types, (type_id as u64));
        (contrib_type.name, contrib_type.description)
    }
} 