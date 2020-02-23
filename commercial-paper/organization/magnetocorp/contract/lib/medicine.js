/*
SPDX-License-Identifier: Apache-2.0
*/
'use strict';
// Utility class for ledger state
const State = require('./../ledger-api/state.js');
// Enumerate lime med state values
const medState = {
    ISSUED: 1,
    TRADING: 2,
    REDEEMED: 3
};
/**
 * Medicine class extends State class
 * Class will be used by application and smart contract to define a medicine
 */
class Medicine extends State {
    constructor(obj) {
        super(Medicine.getClass(), [obj.issuer, obj.paperNumber]);
        Object.assign(this, obj);
    }
    /**
     * Basic getters and setters
    */
    getIssuer() {
        return this.issuer;
    }
    setIssuer(newIssuer) {
        this.issuer = newIssuer;
    }
    getOwner() {
        return this.owner;
    }
    setOwner(newOwner) {
        this.owner = newOwner;
    }
    /**
     * Useful methods to encapsulate lime med states
     */
    setIssued() {
        this.currentState = medState.ISSUED;
    }
    setTrading() {
        this.currentState = medState.TRADING;
    }
    setRedeemed() {
        this.currentState = medState.REDEEMED;
    }
    isIssued() {
        return this.currentState === medState.ISSUED;
    }
    isTrading() {
        return this.currentState === medState.TRADING;
    }
    isRedeemed() {
        return this.currentState === medState.REDEEMED;
    }
    static fromBuffer(buffer) {
        return LimeMed.deserialize(buffer);
    }
    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }
    /**
     * Deserialize a state data to lime med
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, LimeMed);
    }

    /**
     * Factory method to create a commercial medicine object
     */
    static createInstance(distributor, medNumber, issueDateTime, maturityDateTime, faceValue) {
        return new LimeMed({ distributor, medNumber, issueDateTime, maturityDateTime, faceValue });
    }

    static getClass() {
        return 'org.limeCare.medicine';
    }
}

module.exports = LimeMed;
