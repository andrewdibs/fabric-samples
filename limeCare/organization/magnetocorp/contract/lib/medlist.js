/*
SPDX-License-Identifier: Apache-2.0
*/
'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('./../ledger-api/statelist.js');
const Medicine = require('./medicine.js');

class MedList extends StateList {
    constructor(ctx) {
        super(ctx, 'org.limeCare.medlist');
        this.use(Medicine);
    }
    async addMed(med) {
        return this.addState(paper);
    }
    async getMed(medKey) {
        return this.getState(paperKey);
    }
    async updateMed(med) {
        return this.updateState(paper);
    }
}

module.exports = MedList;