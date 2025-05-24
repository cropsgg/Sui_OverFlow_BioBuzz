import { bcs } from '@mysten/sui.js/bcs';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { LabShareDAO } from './sui-contracts';
import { createTxBlock, executeTransaction, getProvider, PACKAGE_ID, DAO_MODULE, DAO_OBJECT_ID } from './sui-client';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui.js/utils';

// A function to track transactions - will be set by components that have access to provider
let trackTransactionFn: ((txId: string) => void) | null = null;

export const setTransactionTracker = (fn: (txId: string) => void) => {
  trackTransactionFn = fn;
};

// Implementation of the LabShareDAO interface using the real contract
export const labShareDAOClient: LabShareDAO = {
  createProposal: async (title: string, description: string, proposalType: string) => {
    try {
      const provider = getProvider();
      const txb = createTxBlock();
      
      // Convert proposal type to the numeric value used in the contract
      let proposalTypeNum = 0; // 0: General, 1: Alert, 2: Configuration
      if (proposalType === "alert") proposalTypeNum = 1;
      if (proposalType === "configuration") proposalTypeNum = 2;
      
      // Call the create_proposal function from our contract
      txb.moveCall({
        target: `${PACKAGE_ID}::${DAO_MODULE}::create_proposal`,
        arguments: [
          txb.object(DAO_OBJECT_ID), // DAO object
          txb.pure(title), // title
          txb.pure(description), // description
          txb.pure(proposalTypeNum), // proposal_type
          txb.object(SUI_CLOCK_OBJECT_ID), // clock
        ],
      });
      
      // Execute the transaction
      const result = await executeTransaction(txb);
      
      // Log transaction details for debugging
      if (result) {
        console.log(`Proposal creation transaction successful. Digest: ${result}`);
        // Track transaction if tracker function is set
        if (trackTransactionFn) {
          trackTransactionFn(result);
        }
      }
      
      return result || "failed-transaction";
    } catch (error) {
      console.error("Error creating proposal:", error);
      return "error-transaction";
    }
  },

  vote: async (proposalId: string, vote: "yes" | "no" | "abstain") => {
    try {
      const txb = createTxBlock();
      // Abstain is not supported in our contract, so we'll only handle yes/no
      if (vote === "abstain") return false;
      
      // Call the vote function
      txb.moveCall({
        target: `${PACKAGE_ID}::${DAO_MODULE}::vote`,
        arguments: [
          txb.object(DAO_OBJECT_ID), // DAO object
          txb.object(proposalId), // proposal_id
          txb.pure(vote === "yes"), // vote boolean (true = yes, false = no)
          txb.object(SUI_CLOCK_OBJECT_ID), // clock
        ],
      });
      
      // Execute the transaction
      const result = await executeTransaction(txb);
      return !!result;
    } catch (error) {
      console.error("Error voting on proposal:", error);
      return false;
    }
  },

  executeProposal: async (proposalId: string) => {
    try {
      const txb = createTxBlock();
      
      // Call the execute_proposal function
      txb.moveCall({
        target: `${PACKAGE_ID}::${DAO_MODULE}::execute_proposal`,
        arguments: [
          txb.object(DAO_OBJECT_ID), // DAO object
          txb.object(proposalId), // proposal_id
          txb.object(SUI_CLOCK_OBJECT_ID), // clock
        ],
      });
      
      // Execute the transaction
      const result = await executeTransaction(txb);
      return !!result;
    } catch (error) {
      console.error("Error executing proposal:", error);
      return false;
    }
  },

  addMember: async (labAddress: string, name: string, role: string) => {
    try {
      const txb = createTxBlock();
      
      // Role is not used in our contract, but we include it for interface consistency
      txb.moveCall({
        target: `${PACKAGE_ID}::${DAO_MODULE}::add_member`,
        arguments: [
          txb.object(DAO_OBJECT_ID), // DAO object
          txb.pure(labAddress), // new member address
          txb.pure(name), // member name
        ],
      });
      
      // Execute the transaction
      const result = await executeTransaction(txb);
      return !!result;
    } catch (error) {
      console.error("Error adding member:", error);
      return false;
    }
  },

  removeMember: async (labAddress: string) => {
    // Our contract doesn't have a remove member function
    console.warn("removeMember is not implemented in the current contract");
    return false;
  },

  updateMemberRole: async (labAddress: string, newRole: string) => {
    // Our contract doesn't have an update role function
    console.warn("updateMemberRole is not implemented in the current contract");
    return false;
  },

  grantAccess: async (fileHash: string, recipientAddress: string) => {
    // This would need to be implemented in a custom way
    console.warn("grantAccess is not directly implemented in the current contract");
    return false;
  },

  revokeAccess: async (fileHash: string, recipientAddress: string) => {
    // This would need to be implemented in a custom way
    console.warn("revokeAccess is not directly implemented in the current contract");
    return false;
  },

  registerFile: async (fileHash: string, encryptedMetadata: string) => {
    // This would need to be mapped to a custom function or data submission
    console.warn("registerFile is not directly implemented in the current contract");
    return "not-implemented";
  },

  updateFileMetadata: async (fileId: string, encryptedMetadata: string) => {
    // This would need to be mapped to a custom function
    console.warn("updateFileMetadata is not directly implemented in the current contract");
    return false;
  },

  registerSensor: async (sensorId: string, sensorType: string, location: string) => {
    // This would need custom implementation or mapping to our threshold update
    console.warn("registerSensor is not directly implemented in the current contract");
    return false;
  },

  recordSensorData: async (sensorId: string, dataHash: string, timestamp: number) => {
    try {
      const txb = createTxBlock();
      
      // Map to submit_data function
      // Convert sensorId to a sensor type
      const sensorType = parseInt(sensorId) || 0;
      
      // Create empty vec<u8> for data_hash
      const dataHashBytes = Array.from(new TextEncoder().encode(dataHash));
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${DAO_MODULE}::submit_data`,
        arguments: [
          txb.object(DAO_OBJECT_ID), // DAO object
          txb.pure(sensorType), // sensor_type as u8
          txb.pure(dataHashBytes), // data_hash as vector<u8>
          txb.pure(JSON.stringify({hash: dataHash, time: timestamp})), // metadata as String
          txb.pure(timestamp % 100), // value as u64 (using timestamp mod 100 as a sample value)
          txb.object(SUI_CLOCK_OBJECT_ID), // clock
        ],
      });
      
      // Execute the transaction
      const result = await executeTransaction(txb);
      
      // Log transaction details for debugging
      if (result) {
        console.log(`Sensor data submission transaction successful. Digest: ${result}`);
        // Track transaction if tracker function is set
        if (trackTransactionFn) {
          trackTransactionFn(result);
        }
      }
      
      return result || "failed-transaction";
    } catch (error) {
      console.error("Error recording sensor data:", error);
      return "error-transaction";
    }
  },

  verifySensorData: async (recordId: string) => {
    // This would be a read operation to verify the data
    try {
      const provider = getProvider();
      // Get the data record object
      const object = await provider.getObject({
        id: recordId,
        options: {
          showContent: true,
        }
      });
      
      // If we can retrieve the object, consider it verified
      return !!object;
    } catch (error) {
      console.error("Error verifying sensor data:", error);
      return false;
    }
  }
}; 