#[test_only]
module labshare_dao::payment_rails_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::object::{Self, ID};
    use sui::clock::{Self, Clock};
    use sui::transfer;
    use std::string;
    use std::option;
    use std::vector;

    use labshare_dao::lab_escrow;
    use labshare_dao::lab_services_marketplace;
    use labshare_dao::research_incentives;

    // Test addresses
    const ADMIN: address = @0xA;
    const FUNDER: address = @0xB;
    const BENEFICIARY: address = @0xC;
    const SERVICE_PROVIDER: address = @0xD;
    const BUYER: address = @0xE;

    // Helper function to create a clock for testing
    fun setup_clock(scenario: &mut Scenario) {
        test_scenario::next_tx(scenario, ADMIN);
        {
            let clock = clock::create_for_testing(test_scenario::ctx(scenario));
            clock::share_for_testing(clock);
        };
    }

    // Helper function to mint test coins
    fun mint_for_testing(amount: u64, recipient: address, scenario: &mut Scenario): Coin<SUI> {
        coin::mint_for_testing<SUI>(amount, test_scenario::ctx(scenario))
    }

    #[test]
    fun test_escrow_basic_flow() {
        let mut scenario = test_scenario::begin(ADMIN);
        setup_clock(&mut scenario);

        // Initialize escrow
        test_scenario::next_tx(&mut scenario, FUNDER);
        {
            let clock = test_scenario::take_shared<Clock>(&scenario);
            let escrow_id = lab_escrow::initialize_escrow(
                FUNDER,
                BENEFICIARY,
                1000, // 1000 SUI total
                option::none(),
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(clock);
        };

        // Deposit funds to escrow
        test_scenario::next_tx(&mut scenario, FUNDER);
        {
            let mut escrow = test_scenario::take_shared<lab_escrow::EscrowAccount>(&scenario);
            let funds = mint_for_testing(1000, FUNDER, &mut scenario);
            
            lab_escrow::deposit_funds_to_escrow(
                &mut escrow,
                funds,
                test_scenario::ctx(&mut scenario)
            );
            
            // Check escrow balance
            let balance = lab_escrow::get_escrow_balance(&escrow);
            assert!(balance == 1000, 0);
            
            test_scenario::return_shared(escrow);
        };

        // Define a milestone
        test_scenario::next_tx(&mut scenario, FUNDER);
        {
            let mut escrow = test_scenario::take_shared<lab_escrow::EscrowAccount>(&scenario);
            
            lab_escrow::define_milestone(
                &mut escrow,
                string::utf8(b"Complete research phase 1"),
                500, // 500 SUI for this milestone
                1234567890, // due date
                option::none(),
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(escrow);
        };

        // Beneficiary submits milestone for approval
        test_scenario::next_tx(&mut scenario, BENEFICIARY);
        {
            let mut escrow = test_scenario::take_shared<lab_escrow::EscrowAccount>(&scenario);
            
            lab_escrow::submit_milestone_for_approval(
                &mut escrow,
                0, // milestone index
                string::utf8(b"https://proof.link/milestone1"),
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(escrow);
        };

        // Funder approves milestone
        test_scenario::next_tx(&mut scenario, FUNDER);
        {
            let mut escrow = test_scenario::take_shared<lab_escrow::EscrowAccount>(&scenario);
            
            lab_escrow::approve_milestone(
                &mut escrow,
                0, // milestone index
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(escrow);
        };

        // Release payment
        test_scenario::next_tx(&mut scenario, FUNDER);
        {
            let mut escrow = test_scenario::take_shared<lab_escrow::EscrowAccount>(&scenario);
            
            let payment = lab_escrow::release_milestone_payment(
                &mut escrow,
                0, // milestone index
                test_scenario::ctx(&mut scenario)
            );
            
            // Check payment amount
            assert!(coin::value(&payment) == 500, 0);
            
            // Transfer payment to beneficiary
            transfer::public_transfer(payment, BENEFICIARY);
            
            test_scenario::return_shared(escrow);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_marketplace_basic_flow() {
        let mut scenario = test_scenario::begin(ADMIN);
        setup_clock(&mut scenario);

        // Initialize marketplace
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let initial_treasury = mint_for_testing(100, ADMIN, &mut scenario);
            let marketplace_id = lab_services_marketplace::initialize_marketplace(
                string::utf8(b"Lab Services Marketplace"),
                string::utf8(b"A marketplace for research lab services"),
                initial_treasury,
                test_scenario::ctx(&mut scenario)
            );
        };

        // Service provider lists a service
        test_scenario::next_tx(&mut scenario, SERVICE_PROVIDER);
        {
            let mut marketplace = test_scenario::take_shared<lab_services_marketplace::Marketplace>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let listing_id = lab_services_marketplace::list_service(
                &mut marketplace,
                string::utf8(b"PCR Analysis Service"),
                string::utf8(b"Professional PCR analysis for research samples"),
                1, // Sample Analysis category
                100, // 100 SUI per unit
                string::utf8(b"{}"), // metadata
                option::none(),
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(clock);
            test_scenario::return_shared(marketplace);
        };

        // Buyer purchases the service
        test_scenario::next_tx(&mut scenario, BUYER);
        {
            let mut marketplace = test_scenario::take_shared<lab_services_marketplace::Marketplace>(&scenario);
            let listing = test_scenario::take_shared<lab_services_marketplace::ServiceListing>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            let funds = mint_for_testing(200, BUYER, &mut scenario); // 200 SUI (2 units)
            
            let agreement_id = lab_services_marketplace::purchase_service(
                &mut marketplace,
                &listing,
                2, // quantity = 2 units
                funds,
                option::none(), // no deadline
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(clock);
            test_scenario::return_shared(listing);
            test_scenario::return_shared(marketplace);
        };

        // Service provider delivers the service
        test_scenario::next_tx(&mut scenario, SERVICE_PROVIDER);
        {
            let mut agreement = test_scenario::take_shared<lab_services_marketplace::ServiceAgreement>(&scenario);
            
            lab_services_marketplace::deliver_service(
                &mut agreement,
                string::utf8(b"Service completed - results delivered"),
                option::none(),
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(agreement);
        };

        // Buyer confirms delivery and releases payment
        test_scenario::next_tx(&mut scenario, BUYER);
        {
            let mut marketplace = test_scenario::take_shared<lab_services_marketplace::Marketplace>(&scenario);
            let mut agreement = test_scenario::take_shared<lab_services_marketplace::ServiceAgreement>(&scenario);
            
            lab_services_marketplace::confirm_service_delivery(
                &mut marketplace,
                &mut agreement,
                option::some(5), // 5-star rating
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(agreement);
            test_scenario::return_shared(marketplace);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_research_incentives_basic_flow() {
        let mut scenario = test_scenario::begin(ADMIN);
        setup_clock(&mut scenario);

        // Initialize incentives registry
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let registry_id = research_incentives::initialize_incentives_registry(
                test_scenario::ctx(&mut scenario)
            );
        };

        // Create a reward pool
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut registry = test_scenario::take_shared<research_incentives::IncentivesRegistry>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            let initial_funds = mint_for_testing(1000, ADMIN, &mut scenario);
            
            let mut eligible_types = vector::empty<u8>();
            vector::push_back(&mut eligible_types, 0); // Dataset Submission
            
            let pool_id = research_incentives::create_reward_pool(
                &mut registry,
                string::utf8(b"Dataset Submission Rewards"),
                string::utf8(b"Rewards for high-quality dataset submissions"),
                string::utf8(b"Must include proper documentation and validation"),
                eligible_types,
                initial_funds,
                option::none(),
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(clock);
            test_scenario::return_shared(registry);
        };

        // Register a contribution
        test_scenario::next_tx(&mut scenario, BENEFICIARY);
        {
            let mut registry = test_scenario::take_shared<research_incentives::IncentivesRegistry>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let receipt_id = research_incentives::register_contribution(
                &mut registry,
                0, // Dataset Submission type
                object::id_from_address(@0x123), // mock reference ID
                string::utf8(b"COVID-19 Research Dataset"),
                string::utf8(b"Comprehensive dataset on COVID-19 patient outcomes"),
                string::utf8(b"{}"), // metadata
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(clock);
            test_scenario::return_shared(registry);
        };

        // Evaluate and reward the contribution
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut registry = test_scenario::take_shared<research_incentives::IncentivesRegistry>(&scenario);
            let mut pool = test_scenario::take_shared<research_incentives::RewardPool>(&scenario);
            let mut receipt = test_scenario::take_shared<research_incentives::ContributionReceipt>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let mut reward_option = research_incentives::evaluate_and_reward_contribution(
                &mut registry,
                &mut pool,
                &mut receipt,
                true, // approved
                200, // 200 SUI reward
                option::some(string::utf8(b"Excellent dataset quality")),
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            // Check that reward was issued
            assert!(option::is_some(&reward_option), 0);
            let reward = option::extract(&mut reward_option);
            assert!(coin::value(&reward) == 200, 1);
            
            // Transfer reward to contributor
            transfer::public_transfer(reward, BENEFICIARY);
            
            // Destroy the empty option
            option::destroy_none(reward_option);
            
            test_scenario::return_shared(clock);
            test_scenario::return_shared(receipt);
            test_scenario::return_shared(pool);
            test_scenario::return_shared(registry);
        };

        test_scenario::end(scenario);
    }
} 