/*
#[test_only]
module labshare_dao::labshare_dao_tests;
// uncomment this line to import the module
// use labshare_dao::labshare_dao;

const ENotImplemented: u64 = 0;

#[test]
fun test_labshare_dao() {
    // pass
}

#[test, expected_failure(abort_code = ::labshare_dao::labshare_dao_tests::ENotImplemented)]
fun test_labshare_dao_fail() {
    abort ENotImplemented
}
*/

#[test_only]
module labshare_dao::labshare_dao_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin;
    use sui::sui::SUI;
    use sui::object::{Self, ID};
    use sui::test_utils;
    use sui::tx_context;
    use sui::clock::{Self, Clock};
    use std::string;
    use labshare_dao::labshare_dao::{Self, DAO};

    // Test addresses
    const ADMIN: address = @0xA;
    const MEMBER1: address = @0xB;
    const MEMBER2: address = @0xC;
    const NON_MEMBER: address = @0xD;

    // Helper function to create a test DAO
    fun setup_dao(scenario: &mut Scenario): ID {
        // Start transaction from admin
        test_scenario::next_tx(scenario, ADMIN);
        {
            // Create a test coin for initial funds
            let ctx = test_scenario::ctx(scenario);
            let initial_funds = coin::mint_for_testing<SUI>(1000, ctx);
            
            // Create the DAO
            labshare_dao::initialize(
                string::utf8(b"LabShareDAO"), 
                string::utf8(b"A decentralized platform for research labs to share data securely"),
                initial_funds,
                ctx
            );
        };
        
        // Get DAO ID
        test_scenario::next_tx(scenario, ADMIN);
        let dao = test_scenario::take_shared<DAO>(scenario);
        let dao_id = object::id(&dao);
        test_scenario::return_shared(dao);
        
        dao_id
    }

    // Helper function to create a clock for testing
    fun setup_clock(scenario: &mut Scenario) {
        test_scenario::next_tx(scenario, ADMIN);
        {
            let ctx = test_scenario::ctx(scenario);
            let clock = clock::create_for_testing(ctx);
            test_scenario::return_shared(clock);
        };
    }

    #[test]
    fun test_dao_creation() {
        // Create a test scenario
        let mut scenario = test_scenario::begin(ADMIN);
        
        // Create the DAO
        let dao_id = setup_dao(&mut scenario);
        
        // Check that the DAO exists and has correct data
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let dao = test_scenario::take_shared<DAO>(&scenario);
            
            // Check DAO info
            let (id, name, description, admin, member_count) = labshare_dao::get_dao_info(&dao);
            assert!(id == dao_id, 0);
            assert!(name == string::utf8(b"LabShareDAO"), 1);
            assert!(description == string::utf8(b"A decentralized platform for research labs to share data securely"), 2);
            assert!(admin == ADMIN, 3);
            assert!(member_count == 1, 4); // Admin is the only member initially
            
            // Check treasury balance
            let balance = labshare_dao::get_treasury_balance(&dao);
            assert!(balance == 1000, 5);
            
            // Check that admin is a member
            assert!(labshare_dao::is_member(&dao, ADMIN), 6);
            
            test_scenario::return_shared(dao);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_add_member() {
        // Create a test scenario
        let mut scenario = test_scenario::begin(ADMIN);
        
        // Create the DAO
        let _dao_id = setup_dao(&mut scenario);
        
        // Add a new member
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut dao = test_scenario::take_shared<DAO>(&scenario);
            
            labshare_dao::add_member(
                &mut dao,
                MEMBER1,
                string::utf8(b"Researcher 1"),
                test_scenario::ctx(&mut scenario)
            );
            
            // Check that new member was added
            assert!(labshare_dao::is_member(&dao, MEMBER1), 0);
            
            // Get DAO info and check member count
            let (_, _, _, _, member_count) = labshare_dao::get_dao_info(&dao);
            assert!(member_count == 2, 1);
            
            test_scenario::return_shared(dao);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_submit_data_and_alert() {
        // Create a test scenario
        let mut scenario = test_scenario::begin(ADMIN);
        
        // Create the DAO and add a member
        let _dao_id = setup_dao(&mut scenario);
        setup_clock(&mut scenario);
        
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut dao = test_scenario::take_shared<DAO>(&scenario);
            
            labshare_dao::add_member(
                &mut dao,
                MEMBER1,
                string::utf8(b"Researcher 1"),
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(dao);
        };
        
        // Member submits normal data (within threshold)
        test_scenario::next_tx(&mut scenario, MEMBER1);
        {
            let mut dao = test_scenario::take_shared<DAO>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            // Submit temperature data (20°C - within threshold of 15-30°C)
            let data_hash = x"1234567890abcdef1234567890abcdef";
            let data_id = labshare_dao::submit_data(
                &mut dao,
                0, // Temperature sensor
                data_hash,
                string::utf8(b"Normal temperature reading"),
                20, // 20°C - within threshold
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            // Get data record and check it
            let (_, sensor_type, submitted_by, _, value, triggered_alert) = 
                labshare_dao::get_data_record(&dao, data_id);
            
            assert!(sensor_type == 0, 0); // Temperature sensor
            assert!(submitted_by == MEMBER1, 1);
            assert!(value == 20, 2);
            assert!(triggered_alert == false, 3); // No alert should be triggered
            
            test_scenario::return_shared(clock);
            test_scenario::return_shared(dao);
        };
        
        // Member submits data that triggers an alert
        test_scenario::next_tx(&mut scenario, MEMBER1);
        {
            let mut dao = test_scenario::take_shared<DAO>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            // Submit temperature data (35°C - above threshold of 15-30°C)
            let data_hash = x"0987654321fedcba0987654321fedcba";
            let data_id = labshare_dao::submit_data(
                &mut dao,
                0, // Temperature sensor
                data_hash,
                string::utf8(b"High temperature reading"),
                35, // 35°C - above threshold
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            // Get data record and check it
            let (_, sensor_type, submitted_by, _, value, triggered_alert) = 
                labshare_dao::get_data_record(&dao, data_id);
            
            assert!(sensor_type == 0, 0); // Temperature sensor
            assert!(submitted_by == MEMBER1, 1);
            assert!(value == 35, 2);
            assert!(triggered_alert == true, 3); // Alert should be triggered
            
            test_scenario::return_shared(clock);
            test_scenario::return_shared(dao);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_voting_on_proposal() {
        // Create a test scenario
        let mut scenario = test_scenario::begin(ADMIN);
        
        // Create the DAO and add members
        let _dao_id = setup_dao(&mut scenario);
        setup_clock(&mut scenario);
        
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut dao = test_scenario::take_shared<DAO>(&scenario);
            
            labshare_dao::add_member(
                &mut dao,
                MEMBER1,
                string::utf8(b"Researcher 1"),
                test_scenario::ctx(&mut scenario)
            );
            
            labshare_dao::add_member(
                &mut dao,
                MEMBER2,
                string::utf8(b"Researcher 2"),
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(dao);
        };
        
        // Create a proposal
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut dao = test_scenario::take_shared<DAO>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            labshare_dao::create_proposal(
                &mut dao,
                string::utf8(b"New Equipment Purchase"),
                string::utf8(b"Proposal to buy new microscope"),
                0, // General proposal
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(clock);
            test_scenario::return_shared(dao);
        };
        
        // TODO: Complete voting test
        // This would require being able to get proposal IDs from the DAO
        // In a real system we'd have a function to list proposal IDs
        
        test_scenario::end(scenario);
    }
}
