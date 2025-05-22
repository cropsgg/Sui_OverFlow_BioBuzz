/*
/// Module: labshare_dao
module labshare_dao::labshare_dao;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

// LabShareDAO Smart Contract
// A decentralized platform for research labs to securely share data and collaborate
// Features:
// - DAO membership management
// - Verifiable data pipeline with IoT data hashing
// - Threshold-based alert system
// - Automated proposal creation
// - Simple voting mechanism
// - Basic treasury management

module labshare_dao::labshare_dao {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};

    // ===== Constants =====
    const MINIMUM_QUORUM: u64 = 50; // 50% quorum needed for proposals
    const VOTING_PERIOD: u64 = 86400; // 1 day in seconds

    // ===== Error Codes =====
    const ENotDAOAdmin: u64 = 0;
    const ENotDAOMember: u64 = 1;
    const EAlreadyMember: u64 = 2;
    const EInvalidProposal: u64 = 3;
    const EProposalNotActive: u64 = 4;
    const EAlreadyVoted: u64 = 5;
    const EInvalidSensor: u64 = 7;
    const EInvalidThreshold: u64 = 8;
    const EVotingPeriodEnded: u64 = 9;
    const EVotingPeriodNotEnded: u64 = 10;

    // ===== Structs =====

    // Lab sensor types
    public struct SensorType has copy, drop, store {
        id: u8,
        name: String,
    }

    // Core DAO object
    public struct DAO has key {
        id: UID,
        name: String,
        description: String,
        admin: address,
        member_count: u64,
        members: Table<address, Member>,
        treasury: Coin<SUI>,
        sensors: vector<SensorType>,
        thresholds: Table<u8, ThresholdConfig>, // Sensor type ID -> Threshold config
        proposals: Table<ID, Proposal>,
        data_records: Table<ID, DataRecord>,
        next_proposal_id: u64,
        next_data_id: u64,
    }

    // Member information
    public struct Member has store {
        addr: address,
        name: String,
        joined_at: u64,
        voting_power: u64,
    }

    // Threshold configuration for sensors
    public struct ThresholdConfig has store, copy, drop {
        sensor_type_id: u8,
        min_value: u64,
        max_value: u64,
        description: String,
    }

    // Data record for IoT data
    public struct DataRecord has key, store {
        id: UID,
        data_id: u64,
        sensor_type: u8,
        submitted_by: address,
        data_hash: vector<u8>,
        metadata: String, // JSON or other metadata format
        timestamp: u64,
        value: u64, // Numeric representation of the data
        triggered_alert: bool,
        alert_proposal_id: Option<ID>,
    }

    // Proposal types
    public struct ProposalType has store, copy, drop {
        id: u8,
        name: String,
    }

    // Proposal object
    public struct Proposal has key, store {
        id: UID,
        proposal_id: u64,
        proposal_type: u8, // 0: General, 1: Alert, 2: Configuration
        title: String,
        description: String,
        proposer: address,
        created_at: u64,
        voting_end_time: u64,
        executed: bool,
        yes_votes: u64,
        no_votes: u64,
        voters: Table<address, bool>, // address -> vote (true = yes, false = no)
        data_reference: Option<ID>, // Reference to any related data
        alert_data_value: Option<u64>, // Specific value that triggered alert
        alert_sensor_id: Option<u8>, // Sensor that triggered the alert
    }

    // ===== Events =====
    public struct MemberAdded has copy, drop {
        dao_id: ID,
        member: address,
        name: String,
    }

    public struct DataRecordCreated has copy, drop {
        dao_id: ID,
        data_id: u64,
        sensor_type: u8,
        submitted_by: address,
        timestamp: u64,
        triggered_alert: bool,
    }

    public struct ProposalCreated has copy, drop {
        dao_id: ID,
        proposal_id: u64,
        proposal_type: u8,
        title: String,
        proposer: address,
    }

    public struct VoteCast has copy, drop {
        dao_id: ID,
        proposal_id: u64,
        voter: address,
        vote: bool,
    }

    public struct ProposalExecuted has copy, drop {
        dao_id: ID,
        proposal_id: u64,
        approved: bool,
    }

    public struct AlertTriggered has copy, drop {
        dao_id: ID,
        data_id: u64,
        sensor_type: u8,
        value: u64,
        threshold_min: u64,
        threshold_max: u64,
        proposal_id: u64,
    }

    // ===== Functions =====

    // Initialize a new DAO
    public fun initialize(
        name: String, 
        description: String,
        initial_funds: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let mut dao = DAO {
            id: object::new(ctx),
            name,
            description,
            admin: tx_context::sender(ctx),
            member_count: 1, // Admin is the first member
            members: table::new(ctx),
            treasury: initial_funds,
            sensors: vector::empty(),
            thresholds: table::new(ctx),
            proposals: table::new(ctx),
            data_records: table::new(ctx),
            next_proposal_id: 0,
            next_data_id: 0,
        };

        // Add admin as the first member
        let admin_addr = tx_context::sender(ctx);
        let admin_member = Member {
            addr: admin_addr,
            name: string::utf8(b"Admin"),
            joined_at: tx_context::epoch(ctx),
            voting_power: 100, // Admin has extra voting power
        };
        table::add(&mut dao.members, admin_addr, admin_member);

        // Default sensor types
        vector::push_back(&mut dao.sensors, SensorType { id: 0, name: string::utf8(b"Temperature") });
        vector::push_back(&mut dao.sensors, SensorType { id: 1, name: string::utf8(b"Humidity") });
        vector::push_back(&mut dao.sensors, SensorType { id: 2, name: string::utf8(b"Pressure") });
        vector::push_back(&mut dao.sensors, SensorType { id: 3, name: string::utf8(b"Luminosity") });

        // Default thresholds
        table::add(&mut dao.thresholds, 0, ThresholdConfig { 
            sensor_type_id: 0, 
            min_value: 15, // 15°C
            max_value: 30, // 30°C
            description: string::utf8(b"Safe temperature range for lab samples")
        });

        table::add(&mut dao.thresholds, 1, ThresholdConfig { 
            sensor_type_id: 1, 
            min_value: 30, // 30%
            max_value: 70, // 70%
            description: string::utf8(b"Safe humidity range for lab environment")
        });

        transfer::share_object(dao);
    }

    // Add a new member to the DAO
    public fun add_member(
        dao: &mut DAO, 
        new_member: address, 
        name: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check if sender is admin
        assert!(sender == dao.admin, ENotDAOAdmin);
        
        // Check if address is already a member
        assert!(!table::contains(&dao.members, new_member), EAlreadyMember);

        // Create new member
        let member = Member {
            addr: new_member,
            name,
            joined_at: tx_context::epoch(ctx),
            voting_power: 10, // Default voting power
        };

        // Add member to DAO
        table::add(&mut dao.members, new_member, member);
        dao.member_count = dao.member_count + 1;

        // Emit event
        event::emit(MemberAdded {
            dao_id: object::id(dao),
            member: new_member,
            name,
        });
    }

    // Submit data from IoT sensor
    public fun submit_data(
        dao: &mut DAO,
        sensor_type: u8,
        data_hash: vector<u8>,
        metadata: String,
        value: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        let sender = tx_context::sender(ctx);
        
        // Check if sender is a member
        assert!(table::contains(&dao.members, sender), ENotDAOMember);
        
        // Check if sensor type is valid
        let mut valid_sensor = false;
        let len = vector::length(&dao.sensors);
        
        // Check if sensor type is valid
        let mut i = 0;
        while (i < len) {
            let sensor = *vector::borrow(&dao.sensors, i);
            if (sensor.id == sensor_type) {
                valid_sensor = true;
                break
            };
            i = i + 1;
        };
        
        assert!(valid_sensor, EInvalidSensor);
        
        // Check if we need to trigger an alert based on thresholds
        let mut triggered_alert = false;
        let mut alert_proposal_id = option::none();
        
        if (table::contains(&dao.thresholds, sensor_type)) {
            let threshold = *table::borrow(&dao.thresholds, sensor_type);
            
            // Check if value is outside the threshold
            if (value < threshold.min_value || value > threshold.max_value) {
                triggered_alert = true;
                
                // Create alert proposal automatically
                let mut proposal_title = if (value < threshold.min_value) {
                    string::utf8(b"ALERT: Low ")
                } else {
                    string::utf8(b"ALERT: High ")
                };
                
                // Add sensor name to title
                let mut j = 0;
                while (j < len) {
                    let sensor = *vector::borrow(&dao.sensors, j);
                    if (sensor.id == sensor_type) {
                        string::append(&mut proposal_title, sensor.name);
                        break
                    };
                    j = j + 1;
                };
                
                // Create description
                let mut description = if (value < threshold.min_value) {
                    string::utf8(b"Value below minimum threshold: ")
                } else {
                    string::utf8(b"Value above maximum threshold: ")
                };
                
                // TODO: Convert value to string
                string::append(&mut description, string::utf8(b"[See data record for details]"));
                
                // Create the alert proposal
                let current_time = clock::timestamp_ms(clock) / 1000; // convert to seconds
                let proposal_id = object::new(ctx);
                let proposal_uid_id = object::uid_to_inner(&proposal_id); // Get ID from UID for reference
                
                let proposal = Proposal {
                    id: proposal_id,
                    proposal_id: dao.next_proposal_id,
                    proposal_type: 1, // Alert
                    title: proposal_title,
                    description,
                    proposer: sender,
                    created_at: current_time,
                    voting_end_time: current_time + VOTING_PERIOD,
                    executed: false,
                    yes_votes: 0,
                    no_votes: 0,
                    voters: table::new(ctx),
                    data_reference: option::some(proposal_uid_id),
                    alert_data_value: option::some(value),
                    alert_sensor_id: option::some(sensor_type),
                };
                
                let proposal_id = object::id(&proposal);
                
                // Add proposal to DAO
                table::add(&mut dao.proposals, proposal_id, proposal);
                dao.next_proposal_id = dao.next_proposal_id + 1;
                
                alert_proposal_id = option::some(proposal_id);
                
                // Emit proposal created event
                event::emit(ProposalCreated {
                    dao_id: object::id(dao),
                    proposal_id: dao.next_proposal_id - 1,
                    proposal_type: 1,
                    title: proposal_title,
                    proposer: sender,
                });
                
                // Emit alert triggered event
                event::emit(AlertTriggered {
                    dao_id: object::id(dao),
                    data_id: dao.next_data_id,
                    sensor_type,
                    value,
                    threshold_min: threshold.min_value,
                    threshold_max: threshold.max_value,
                    proposal_id: dao.next_proposal_id - 1,
                });
            };
        };
        
        // Create data record
        let data_id = object::new(ctx);
        let data_record = DataRecord {
            id: data_id,
            data_id: dao.next_data_id,
            sensor_type,
            submitted_by: sender,
            data_hash,
            metadata,
            timestamp: clock::timestamp_ms(clock),
            value,
            triggered_alert,
            alert_proposal_id,
        };
        
        let record_id = object::id(&data_record);
        
        // Add data record to DAO
        table::add(&mut dao.data_records, record_id, data_record);
        dao.next_data_id = dao.next_data_id + 1;
        
        // Emit event
        event::emit(DataRecordCreated {
            dao_id: object::id(dao),
            data_id: dao.next_data_id - 1,
            sensor_type,
            submitted_by: sender,
            timestamp: clock::timestamp_ms(clock),
            triggered_alert,
        });
        
        record_id
    }

    // Create a new manual proposal (not triggered by alerts)
    public fun create_proposal(
        dao: &mut DAO,
        title: String,
        description: String,
        proposal_type: u8, // 0: General, 2: Configuration
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check if sender is a member
        assert!(table::contains(&dao.members, sender), ENotDAOMember);
        
        // Only support general and configuration proposals here (alerts are created automatically)
        assert!(proposal_type == 0 || proposal_type == 2, EInvalidProposal);
        
        // Create the proposal
        let current_time = clock::timestamp_ms(clock) / 1000; // convert to seconds
        let proposal = Proposal {
            id: object::new(ctx),
            proposal_id: dao.next_proposal_id,
            proposal_type,
            title,
            description,
            proposer: sender,
            created_at: current_time,
            voting_end_time: current_time + VOTING_PERIOD,
            executed: false,
            yes_votes: 0,
            no_votes: 0,
            voters: table::new(ctx),
            data_reference: option::none(),
            alert_data_value: option::none(),
            alert_sensor_id: option::none(),
        };
        
        // Add proposal to DAO
        table::add(&mut dao.proposals, object::id(&proposal), proposal);
        dao.next_proposal_id = dao.next_proposal_id + 1;
        
        // Emit event
        event::emit(ProposalCreated {
            dao_id: object::id(dao),
            proposal_id: dao.next_proposal_id - 1,
            proposal_type,
            title,
            proposer: sender,
        });
    }

    // Vote on a proposal
    public fun vote(
        dao: &mut DAO,
        proposal_id: ID,
        vote: bool, // true = yes, false = no
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check if sender is a member
        assert!(table::contains(&dao.members, sender), ENotDAOMember);
        
        // Check if proposal exists
        assert!(table::contains(&dao.proposals, proposal_id), EInvalidProposal);
        
        // Get DAO ID first before borrowing
        let dao_id = object::id(dao);
        
        // Get proposal
        let proposal = table::borrow_mut(&mut dao.proposals, proposal_id);
        
        // Check if proposal is still active
        assert!(!proposal.executed, EProposalNotActive);
        
        // Check if voting period is still active
        let current_time = clock::timestamp_ms(clock) / 1000; // convert to seconds
        assert!(current_time <= proposal.voting_end_time, EVotingPeriodEnded);
        
        // Check if member has already voted
        assert!(!table::contains(&proposal.voters, sender), EAlreadyVoted);
        
        // Get member's voting power
        let member = table::borrow(&dao.members, sender);
        let voting_power = member.voting_power;
        
        // Record vote
        table::add(&mut proposal.voters, sender, vote);
        
        // Update vote counts
        if (vote) {
            proposal.yes_votes = proposal.yes_votes + voting_power;
        } else {
            proposal.no_votes = proposal.no_votes + voting_power;
        };
        
        let proposal_id_copy = proposal.proposal_id; // Store proposal ID for event
        
        // Emit event
        event::emit(VoteCast {
            dao_id,
            proposal_id: proposal_id_copy,
            voter: sender,
            vote,
        });
    }

    // Execute a proposal after voting period ends
    public fun execute_proposal(
        dao: &mut DAO,
        proposal_id: ID,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check if sender is a member
        assert!(table::contains(&dao.members, sender), ENotDAOMember);
        
        // Check if proposal exists
        assert!(table::contains(&dao.proposals, proposal_id), EInvalidProposal);
        
        // Get DAO ID first before borrowing
        let dao_id = object::id(dao);
        
        // Get proposal
        let proposal = table::borrow_mut(&mut dao.proposals, proposal_id);
        
        // Check if proposal is not already executed
        assert!(!proposal.executed, EProposalNotActive);
        
        // Check if voting period has ended
        let current_time = clock::timestamp_ms(clock) / 1000; // convert to seconds
        assert!(current_time > proposal.voting_end_time, EVotingPeriodNotEnded);
        
        // Calculate total votes and check if quorum is reached
        let total_votes = proposal.yes_votes + proposal.no_votes;
        let mut total_voting_power = dao.member_count * 10; // Simplified calculation
        
        // Admin has extra voting power
        total_voting_power = total_voting_power + 90; // Admin has 100, others have 10
        
        let quorum_reached = total_votes * 100 >= total_voting_power * MINIMUM_QUORUM;
        
        // Check if proposal is approved (majority + quorum)
        let approved = quorum_reached && proposal.yes_votes > proposal.no_votes;
        
        // Mark proposal as executed
        proposal.executed = true;
        
        // Handle specific proposal actions based on type
        if (proposal.proposal_type == 1 && approved) { // Alert proposal
            // For alerts, we just log that it was acknowledged and approved
            // In a real system, this could trigger notifications or other actions
        } else if (proposal.proposal_type == 2 && approved) { // Configuration change
            // Handle configuration changes
            // In a full system, this would update specific configuration parameters
        };
        
        let proposal_id_copy = proposal.proposal_id;
        
        // Emit event
        event::emit(ProposalExecuted {
            dao_id,
            proposal_id: proposal_id_copy,
            approved,
        });
    }

    // Update a sensor threshold
    public fun update_threshold(
        dao: &mut DAO,
        sensor_type: u8,
        min_value: u64,
        max_value: u64,
        description: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check if sender is admin
        assert!(sender == dao.admin, ENotDAOAdmin);
        
        // Check if sensor type is valid
        let mut valid_sensor = false;
        let len = vector::length(&dao.sensors);
        
        // Check if sensor type is valid
        let mut i = 0;
        while (i < len) {
            let sensor = *vector::borrow(&dao.sensors, i);
            if (sensor.id == sensor_type) {
                valid_sensor = true;
                break
            };
            i = i + 1;
        };
        
        assert!(valid_sensor, EInvalidSensor);
        
        // Validate threshold values
        assert!(min_value < max_value, EInvalidThreshold);
        
        // Update or create threshold
        let threshold_config = ThresholdConfig {
            sensor_type_id: sensor_type,
            min_value,
            max_value,
            description,
        };
        
        if (table::contains(&dao.thresholds, sensor_type)) {
            *table::borrow_mut(&mut dao.thresholds, sensor_type) = threshold_config;
        } else {
            table::add(&mut dao.thresholds, sensor_type, threshold_config);
        };
    }

    // Add funds to the treasury
    public fun add_funds(dao: &mut DAO, funds: Coin<SUI>, _ctx: &mut TxContext) {
        coin::join(&mut dao.treasury, funds);
    }

    // ===== Getter Functions =====

    // Check if an address is a member
    public fun is_member(dao: &DAO, addr: address): bool {
        table::contains(&dao.members, addr)
    }

    // Get member info
    public fun get_member(dao: &DAO, addr: address): (address, String, u64, u64) {
        assert!(table::contains(&dao.members, addr), ENotDAOMember);
        let member = table::borrow(&dao.members, addr);
        (member.addr, member.name, member.joined_at, member.voting_power)
    }

    // Get proposal info
    public fun get_proposal(dao: &DAO, proposal_id: ID): (String, String, address, u64, u64, u64, u64, bool) {
        assert!(table::contains(&dao.proposals, proposal_id), EInvalidProposal);
        let proposal = table::borrow(&dao.proposals, proposal_id);
        (
            proposal.title,
            proposal.description,
            proposal.proposer,
            proposal.created_at,
            proposal.voting_end_time,
            proposal.yes_votes,
            proposal.no_votes,
            proposal.executed
        )
    }

    // Get data record info
    public fun get_data_record(dao: &DAO, record_id: ID): (u64, u8, address, u64, u64, bool) {
        assert!(table::contains(&dao.data_records, record_id), EInvalidProposal);
        let record = table::borrow(&dao.data_records, record_id);
        (
            record.data_id,
            record.sensor_type,
            record.submitted_by,
            record.timestamp,
            record.value,
            record.triggered_alert
        )
    }

    // Get DAO info
    public fun get_dao_info(dao: &DAO): (ID, String, String, address, u64) {
        (
            object::id(dao),
            dao.name,
            dao.description,
            dao.admin,
            dao.member_count
        )
    }

    // Get treasury balance
    public fun get_treasury_balance(dao: &DAO): u64 {
        coin::value(&dao.treasury)
    }
}


