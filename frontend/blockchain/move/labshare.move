module labshare::dao {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;

    // ===== Events =====

    struct MemberAdded has copy, drop {
        lab_address: address,
        name: String,
        role: String
    }

    struct ProposalCreated has copy, drop {
        proposal_id: ID,
        title: String,
        description: String,
        proposer: address
    }

    struct VoteCast has copy, drop {
        proposal_id: ID,
        voter: address,
        vote: u8 // 1 = yes, 2 = no, 3 = abstain
    }

    struct FileRegistered has copy, drop {
        file_id: ID,
        file_hash: String,
        owner: address
    }

    struct AccessGranted has copy, drop {
        file_id: ID,
        recipient: address
    }

    // ===== Objects =====
