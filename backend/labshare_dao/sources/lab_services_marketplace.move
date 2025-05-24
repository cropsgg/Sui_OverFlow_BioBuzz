// LabServicesMarketplace Smart Contract
// Enables labs to list, discover, and pay for various research services,
// equipment access, or dataset usage in a decentralized manner.

module labshare_dao::lab_services_marketplace {
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
    const EInvalidListing: u64 = 1;
    const EInvalidAgreement: u64 = 2;
    const EInsufficientFunds: u64 = 3;
    const EInvalidQuantity: u64 = 4;
    const EListingNotActive: u64 = 5;
    const EAgreementNotActive: u64 = 6;
    const EServiceNotDelivered: u64 = 7;
    const EInvalidPrice: u64 = 8;
    const EServiceAlreadyDelivered: u64 = 9;

    // ===== Structs =====

    // Service categories
    public struct ServiceCategory has copy, drop, store {
        id: u8,
        name: String,
    }

    // Listing status
    public struct ListingStatus has copy, drop, store {
        id: u8,
    }

    // Listing status constants
    public fun active_listing_status(): ListingStatus { ListingStatus { id: 0 } }
    public fun paused_listing_status(): ListingStatus { ListingStatus { id: 1 } }
    public fun delisted_status(): ListingStatus { ListingStatus { id: 2 } }

    // Agreement status
    public struct AgreementStatus has copy, drop, store {
        id: u8,
    }

    // Agreement status constants
    public fun funded_status(): AgreementStatus { AgreementStatus { id: 0 } }
    public fun work_in_progress_status(): AgreementStatus { AgreementStatus { id: 1 } }
    public fun delivered_status(): AgreementStatus { AgreementStatus { id: 2 } }
    public fun completed_status(): AgreementStatus { AgreementStatus { id: 3 } }
    public fun disputed_status(): AgreementStatus { AgreementStatus { id: 4 } }
    public fun refunded_status(): AgreementStatus { AgreementStatus { id: 5 } }

    // Service listing
    public struct ServiceListing has key {
        id: UID,
        listing_id: u64,
        provider: address,
        title: String,
        description: String,
        category: u8,
        price_per_unit: u64, // Price per unit/hour/task
        currency_type: String,
        availability: bool,
        status: ListingStatus,
        total_sales: u64,
        rating_sum: u64,
        rating_count: u64,
        created_at: u64,
        updated_at: u64,
        metadata: String, // JSON metadata for additional fields
        dao_reference: Option<ID>, // Reference to DAO for governance
    }

    // Service agreement between buyer and provider
    public struct ServiceAgreement has key {
        id: UID,
        agreement_id: u64,
        listing_id: ID,
        buyer: address,
        provider: address,
        service_title: String,
        quantity: u64, // Duration/amount of service
        unit_price: u64,
        total_price: u64,
        status: AgreementStatus,
        funds: Coin<SUI>,
        created_at: u64,
        delivery_deadline: Option<u64>,
        delivery_confirmation: Option<String>, // Hash or proof of delivery
        buyer_rating: Option<u8>, // 1-5 stars
        provider_rating: Option<u8>, // 1-5 stars
        data_record_reference: Option<ID>, // Reference to DataRecord from labshare_dao
    }

    // Global marketplace registry
    public struct Marketplace has key {
        id: UID,
        name: String,
        description: String,
        admin: address,
        next_listing_id: u64,
        next_agreement_id: u64,
        active_listings: Table<ID, bool>, // listing_id -> active status
        categories: vector<ServiceCategory>,
        total_volume: u64, // Total trading volume
        fee_percentage: u64, // Platform fee in basis points (100 = 1%)
        treasury: Coin<SUI>,
    }

    // ===== Events =====

    public struct MarketplaceInitialized has copy, drop {
        marketplace_id: ID,
        admin: address,
        name: String,
    }

    public struct ServiceListed has copy, drop {
        marketplace_id: ID,
        listing_id: ID,
        provider: address,
        title: String,
        price: u64,
        category: u8,
    }

    public struct ServiceUpdated has copy, drop {
        listing_id: ID,
        provider: address,
        new_price: Option<u64>,
        new_availability: Option<bool>,
    }

    public struct ServiceDelisted has copy, drop {
        listing_id: ID,
        provider: address,
        reason: String,
    }

    public struct ServicePurchased has copy, drop {
        marketplace_id: ID,
        agreement_id: ID,
        listing_id: ID,
        buyer: address,
        provider: address,
        total_price: u64,
        quantity: u64,
    }

    public struct ServiceDelivered has copy, drop {
        agreement_id: ID,
        provider: address,
        delivery_proof: String,
    }

    public struct ServiceDeliveryConfirmed has copy, drop {
        agreement_id: ID,
        buyer: address,
        rating: Option<u8>,
    }

    public struct PaymentForServiceReleased has copy, drop {
        agreement_id: ID,
        provider: address,
        amount: u64,
        platform_fee: u64,
    }

    public struct ServiceRefundIssued has copy, drop {
        agreement_id: ID,
        buyer: address,
        refund_amount: u64,
        reason: String,
    }

    // ===== Core Functions =====

    // Initialize marketplace
    public fun initialize_marketplace(
        name: String,
        description: String,
        initial_treasury: Coin<SUI>,
        ctx: &mut TxContext
    ): ID {
        let mut categories = vector::empty<ServiceCategory>();
        
        // Default service categories for labs
        vector::push_back(&mut categories, ServiceCategory { id: 0, name: std::string::utf8(b"Equipment Access") });
        vector::push_back(&mut categories, ServiceCategory { id: 1, name: std::string::utf8(b"Sample Analysis") });
        vector::push_back(&mut categories, ServiceCategory { id: 2, name: std::string::utf8(b"Data Processing") });
        vector::push_back(&mut categories, ServiceCategory { id: 3, name: std::string::utf8(b"Computational Tasks") });
        vector::push_back(&mut categories, ServiceCategory { id: 4, name: std::string::utf8(b"Consulting Services") });
        vector::push_back(&mut categories, ServiceCategory { id: 5, name: std::string::utf8(b"Dataset Access") });

        let marketplace = Marketplace {
            id: object::new(ctx),
            name,
            description,
            admin: tx_context::sender(ctx),
            next_listing_id: 0,
            next_agreement_id: 0,
            active_listings: table::new(ctx),
            categories,
            total_volume: 0,
            fee_percentage: 250, // 2.5% platform fee
            treasury: initial_treasury,
        };

        let marketplace_id = object::id(&marketplace);

        event::emit(MarketplaceInitialized {
            marketplace_id,
            admin: tx_context::sender(ctx),
            name,
        });

        transfer::share_object(marketplace);
        marketplace_id
    }

    // List a service
    public fun list_service(
        marketplace: &mut Marketplace,
        title: String,
        description: String,
        category: u8,
        price_per_unit: u64,
        metadata: String,
        dao_reference: Option<ID>,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        assert!(price_per_unit > 0, EInvalidPrice);
        assert!((category as u64) < vector::length(&marketplace.categories), EInvalidListing);

        let listing = ServiceListing {
            id: object::new(ctx),
            listing_id: marketplace.next_listing_id,
            provider: tx_context::sender(ctx),
            title,
            description,
            category,
            price_per_unit,
            currency_type: std::string::utf8(b"SUI"),
            availability: true,
            status: active_listing_status(),
            total_sales: 0,
            rating_sum: 0,
            rating_count: 0,
            created_at: sui::clock::timestamp_ms(clock),
            updated_at: sui::clock::timestamp_ms(clock),
            metadata,
            dao_reference,
        };

        let listing_id = object::id(&listing);
        table::add(&mut marketplace.active_listings, listing_id, true);
        marketplace.next_listing_id = marketplace.next_listing_id + 1;

        event::emit(ServiceListed {
            marketplace_id: object::id(marketplace),
            listing_id,
            provider: tx_context::sender(ctx),
            title,
            price: price_per_unit,
            category,
        });

        transfer::share_object(listing);
        listing_id
    }

    // Update service listing
    public fun update_service_listing(
        _marketplace: &mut Marketplace,
        listing: &mut ServiceListing,
        mut new_price: Option<u64>,
        mut new_description: Option<String>,
        mut new_availability: Option<bool>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == listing.provider, ENotAuthorized);
        assert!(listing.status.id == 0, EListingNotActive); // Active status

        if (option::is_some(&new_price)) {
            let price = option::extract(&mut new_price);
            assert!(price > 0, EInvalidPrice);
            listing.price_per_unit = price;
        };

        if (option::is_some(&new_description)) {
            listing.description = option::extract(&mut new_description);
        };

        if (option::is_some(&new_availability)) {
            listing.availability = option::extract(&mut new_availability);
        };

        listing.updated_at = sui::clock::timestamp_ms(clock);

        event::emit(ServiceUpdated {
            listing_id: object::id(listing),
            provider: sender,
            new_price,
            new_availability,
        });
    }

    // Delist service
    public fun delist_service(
        marketplace: &mut Marketplace,
        listing: &mut ServiceListing,
        reason: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == listing.provider || sender == marketplace.admin, ENotAuthorized);

        listing.status = delisted_status();
        listing.availability = false;

        let listing_id = object::id(listing);
        if (table::contains(&marketplace.active_listings, listing_id)) {
            *table::borrow_mut(&mut marketplace.active_listings, listing_id) = false;
        };

        event::emit(ServiceDelisted {
            listing_id,
            provider: listing.provider,
            reason,
        });
    }

    // Purchase service
    public fun purchase_service(
        marketplace: &mut Marketplace,
        listing: &ServiceListing,
        quantity: u64,
        mut funds: Coin<SUI>,
        delivery_deadline: Option<u64>,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        assert!(quantity > 0, EInvalidQuantity);
        assert!(listing.status.id == 0, EListingNotActive); // Active status
        assert!(listing.availability, EListingNotActive);

        let total_price = listing.price_per_unit * quantity;
        assert!(coin::value(&funds) >= total_price, EInsufficientFunds);

        // Handle excess payment
        let payment = if (coin::value(&funds) > total_price) {
            let payment = coin::split(&mut funds, total_price, ctx);
            transfer::public_transfer(funds, tx_context::sender(ctx)); // Return excess
            payment
        } else {
            funds
        };

        let agreement = ServiceAgreement {
            id: object::new(ctx),
            agreement_id: marketplace.next_agreement_id,
            listing_id: object::id(listing),
            buyer: tx_context::sender(ctx),
            provider: listing.provider,
            service_title: listing.title,
            quantity,
            unit_price: listing.price_per_unit,
            total_price,
            status: funded_status(),
            funds: payment,
            created_at: sui::clock::timestamp_ms(clock),
            delivery_deadline,
            delivery_confirmation: option::none(),
            buyer_rating: option::none(),
            provider_rating: option::none(),
            data_record_reference: option::none(),
        };

        let agreement_id = object::id(&agreement);
        marketplace.next_agreement_id = marketplace.next_agreement_id + 1;

        event::emit(ServicePurchased {
            marketplace_id: object::id(marketplace),
            agreement_id,
            listing_id: object::id(listing),
            buyer: tx_context::sender(ctx),
            provider: listing.provider,
            total_price,
            quantity,
        });

        transfer::share_object(agreement);
        agreement_id
    }

    // Mark service as delivered by provider
    public fun deliver_service(
        agreement: &mut ServiceAgreement,
        delivery_proof: String,
        data_record_reference: Option<ID>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == agreement.provider, ENotAuthorized);
        assert!(agreement.status.id == 0 || agreement.status.id == 1, EAgreementNotActive); // Funded or InProgress

        agreement.status = delivered_status();
        agreement.delivery_confirmation = option::some(delivery_proof);
        
        if (option::is_some(&data_record_reference)) {
            agreement.data_record_reference = data_record_reference;
        };

        event::emit(ServiceDelivered {
            agreement_id: object::id(agreement),
            provider: sender,
            delivery_proof,
        });
    }

    // Confirm service delivery and release payment
    public fun confirm_service_delivery(
        marketplace: &mut Marketplace,
        agreement: &mut ServiceAgreement,
        buyer_rating: Option<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == agreement.buyer, ENotAuthorized);
        assert!(agreement.status.id == 2, EServiceNotDelivered); // Delivered status

        // Validate rating
        if (option::is_some(&buyer_rating)) {
            let rating = *option::borrow(&buyer_rating);
            assert!(rating >= 1 && rating <= 5, EInvalidListing);
            agreement.buyer_rating = buyer_rating;
        };

        agreement.status = completed_status();

        // Calculate platform fee
        let platform_fee = (agreement.total_price * marketplace.fee_percentage) / 10000;
        let provider_payment = agreement.total_price - platform_fee;

        // Extract platform fee
        if (platform_fee > 0) {
            let fee = coin::split(&mut agreement.funds, platform_fee, ctx);
            coin::join(&mut marketplace.treasury, fee);
        };

        // Release payment to provider
        let provider_funds = coin::split(&mut agreement.funds, provider_payment, ctx);
        transfer::public_transfer(provider_funds, agreement.provider);

        // Update marketplace volume
        marketplace.total_volume = marketplace.total_volume + agreement.total_price;

        event::emit(ServiceDeliveryConfirmed {
            agreement_id: object::id(agreement),
            buyer: sender,
            rating: buyer_rating,
        });

        event::emit(PaymentForServiceReleased {
            agreement_id: object::id(agreement),
            provider: agreement.provider,
            amount: provider_payment,
            platform_fee,
        });
    }

    // Request refund (dispute mechanism)
    public fun request_service_refund(
        marketplace: &mut Marketplace,
        agreement: &mut ServiceAgreement,
        reason: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == agreement.buyer, ENotAuthorized);
        assert!(agreement.status.id == 0 || agreement.status.id == 1 || agreement.status.id == 2, EAgreementNotActive);

        agreement.status = disputed_status();

        // In a full implementation, this would trigger DAO governance
        // For now, we'll allow direct refund for demonstration
        let refund_amount = coin::value(&agreement.funds);
        if (refund_amount > 0) {
            let refund = coin::split(&mut agreement.funds, refund_amount, ctx);
            transfer::public_transfer(refund, agreement.buyer);
            agreement.status = refunded_status();
        };

        event::emit(ServiceRefundIssued {
            agreement_id: object::id(agreement),
            buyer: sender,
            refund_amount,
            reason,
        });
    }

    // Update listing with sales statistics (called after successful completion)
    public fun update_listing_stats(
        listing: &mut ServiceListing,
        agreement: &ServiceAgreement,
        _ctx: &mut TxContext
    ) {
        // Only update if agreement is completed
        assert!(agreement.status.id == 3, EAgreementNotActive); // Completed status
        assert!(agreement.listing_id == object::id(listing), EInvalidListing);

        listing.total_sales = listing.total_sales + agreement.total_price;

        // Update rating if provided
        if (option::is_some(&agreement.buyer_rating)) {
            let rating = *option::borrow(&agreement.buyer_rating);
            listing.rating_sum = listing.rating_sum + (rating as u64);
            listing.rating_count = listing.rating_count + 1;
        };
    }

    // ===== Admin Functions =====

    // Update marketplace fee (admin only)
    public fun update_marketplace_fee(
        marketplace: &mut Marketplace,
        new_fee_percentage: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == marketplace.admin, ENotAuthorized);
        assert!(new_fee_percentage <= 1000, EInvalidPrice); // Max 10% fee
        marketplace.fee_percentage = new_fee_percentage;
    }

    // Withdraw platform fees (admin only)
    public fun withdraw_platform_fees(
        marketplace: &mut Marketplace,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<SUI> {
        assert!(tx_context::sender(ctx) == marketplace.admin, ENotAuthorized);
        assert!(coin::value(&marketplace.treasury) >= amount, EInsufficientFunds);
        coin::split(&mut marketplace.treasury, amount, ctx)
    }

    // ===== Getter Functions =====

    public fun get_marketplace_info(marketplace: &Marketplace): (ID, String, address, u64, u64, u64, u64) {
        (
            object::id(marketplace),
            marketplace.name,
            marketplace.admin,
            marketplace.next_listing_id,
            marketplace.next_agreement_id,
            marketplace.total_volume,
            marketplace.fee_percentage
        )
    }

    public fun get_listing_info(listing: &ServiceListing): (ID, address, String, String, u8, u64, bool, u8, u64, u64, u64) {
        (
            object::id(listing),
            listing.provider,
            listing.title,
            listing.description,
            listing.category,
            listing.price_per_unit,
            listing.availability,
            listing.status.id,
            listing.total_sales,
            listing.rating_sum,
            listing.rating_count
        )
    }

    public fun get_agreement_info(agreement: &ServiceAgreement): (ID, ID, address, address, u64, u64, u64, u8, Option<String>) {
        (
            object::id(agreement),
            agreement.listing_id,
            agreement.buyer,
            agreement.provider,
            agreement.quantity,
            agreement.unit_price,
            agreement.total_price,
            agreement.status.id,
            agreement.delivery_confirmation
        )
    }

    public fun get_listing_rating(listing: &ServiceListing): (u64, u64) {
        (listing.rating_sum, listing.rating_count)
    }

    public fun calculate_average_rating(listing: &ServiceListing): u64 {
        if (listing.rating_count == 0) {
            return 0
        };
        listing.rating_sum / listing.rating_count
    }

    public fun is_listing_active(marketplace: &Marketplace, listing_id: ID): bool {
        if (!table::contains(&marketplace.active_listings, listing_id)) {
            return false
        };
        *table::borrow(&marketplace.active_listings, listing_id)
    }
} 