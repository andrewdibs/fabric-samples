/*
SPDX-License-Identifier: Apache-2.0
*/
'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');
// LimeCare specifc classes
const Medicine  = require('./medicine.js');
const MedList = require('./medlist.js');

/**
 * A custom context provides easy access to list of all commercial meds
 */
class MedicineContext extends Context {
    constructor() {
        super();
        // All medss are held in a list of meds
        this.medList = new MedList(this);
    }
}
/**
 * Define commercial med smart contract by extending Fabric Contract class
 *
 */
class MedicineContract extends Contract {
    constructor() {
        // Unique name when multiple contracts per chaincode file
        super('org.limecare.medicine');
    }
    /**
     * Define a custom context for medicine
    */
    createContext() {
        return new MedicineContext();
    }
    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx) {
        // No implementation required with this example
        // It could be where data migration is performed, if necessary
        console.log('Instantiate the contract');
    }    
    /**
* Get medicine 
* @param {Context} ctx the transaction context
* @param {String} distributor medicine distributor
* @param {Integer} medNumber med number for this distributor
*/
async getMed(ctx, distributor, medNumber) {
    try {
      console.log('getMed for: ' + distributor + ' ' + medNumber);
      let medKey = Medicine.makeKey([distributor, medNumber]);
      let med = await ctx.medList.getMed(medKey);
      return med;
    } catch(e) {
      throw new Error('Medicine: ' + medNumber + 'absentfor' + distributor);
    }
  }
    /**
     * Distribute Medicine
     *
     * @param {Context} ctx the transaction context
     * @param {String} distributor med distributor
     * @param {Integer} medNumber med number for this distributor
     * @param {String} issueDateTime med issue date
     * @param {String} maturityDateTime med maturity date
     * @param {Integer} faceValue face value of med
    */
    async issue(ctx, distributor, medNumber, issueDateTime, maturityDateTime, faceValue) {
        // create an instance of the med
        let med = Medicine.createInstance(distributor, medNumber, issueDateTime, maturityDateTime, faceValue);
        // Smart contract, rather than med, moves med into ISSUED state
        med.setIssued();
        // Newly issued med is owned by the distributor
        med.setOwner(distributor);
        // Add the med to the list of all similar commercial meds in the ledger world state
        await ctx.medList.addMed(med);
        // Must return a serialized med to caller of smart contract
        return med;
    }

    /**
     * Buy medicine
     *
     * @param {Context} ctx the transaction context
     * @param {String} distributor medicine distributor 
     * @param {Integer} medNumber med number for this distributor
     * @param {String} currentOwner current owner of med
     * @param {String} newOwner new owner of med
     * @param {Integer} price price paid for this med
     * @param {String} purchaseDateTime time med was purchased 
    */
    async buy(ctx, distributor, medNumber, currentOwner, newOwner, price, purchaseDateTime) {

        // Retrieve the current med using key fields provided
        let medKey = Medicine.makeKey([distributor, medNumber]);
        let med = await ctx.medList.getMed(medKey);

        // Validate current owner
        if (med.getOwner() !== currentOwner) {
            throw new Error('med ' + distributor + medNumber + ' is not owned by ' + currentOwner);
        }
        // First buy moves state from ISSUED to TRADING
        if (med.isIssued()) {
            med.setTrading();
        }

        // Check med is not already REDEEMED
        if (med.isTrading()) {
            med.setOwner(newOwner);
        } else {
            throw new Error('med ' + distributor + medNumber + ' is not trading. Current state = ' +med.getCurrentState());
        }

        // Update the med
        await ctx.medList.updateMed(med);
        return med;
    }

    /**
     * Redeem medicine
     *
     * @param {Context} ctx the transaction context
     * @param {String} distributor medicine distributorr
     * @param {Integer} medNumber med number for this distributorr
     * @param {String} redeemingOwner redeeming owner of medicine
     * @param {String} redeemDateTime time med was redeemed
    */
    async redeem(ctx, distributor, medNumber, redeemingOwner, redeemDateTime) {

        let medKey = Medicine.makeKey([distributor, medNumber]);

        let med = await ctx.medList.getMed(medKey);

        // Check med is not REDEEMED
        if (med.isRedeemed()) {
            throw new Error('med ' + distributorr + medNumber + ' already redeemed');
        }

        // Verify that the redeemer owns the med before redeeming it
        if (med.getOwner() === redeemingOwner) {
            med.setOwner(med.getIssuer());
            med.setRedeemed();
        } else {
            throw new Error('Redeeming owner does not own med' + distributor + medNumber);
        }

        await ctx.medList.updateMed(med);
        return med;
    }

}

module.exports = MedicineContract;
