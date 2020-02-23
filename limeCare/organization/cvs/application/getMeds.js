/*
SPDX-License-Identifier: Apache-2.0
*/
/*
 * This application has 6 basic steps:
 * 1. Select an identity from a inventory
 * 2. Connect to network gateway
 * 3. Access LimeCare network
 * 4. Construct request to query a commercial med
 * 5. Submit transaction
 * 6. Process response
 */
'use strict';
// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const { FileSystemWallet, Gateway } = require('fabric-network');
const Medicine = require('../contract/lib/medicine.js');
// A wallet stores a collection of identities for use
const wallet = new FileSystemWallet('../identity/user/balaji/wallet');
// Main program function
async function main() {
    // A gateway defines the peers used to access Fabric networks
    const gateway = new Gateway();

    // Main try/catch block
    try {
        // Specify userName for network access
        // const userName = 'isabella.issuer@magnetocorp.com';
        const userName = 'Admin@org1.example.com';
        // Load connection profile; will be used to locate a gateway 
        let connectionProfile = yaml.safeLoad(fs.readFileSync('../gateway/networkConnection.yaml', 'utf8'));
        // Set connection options; identity and wallet
        let connectionOptions = {
            identity: userName,
            wallet: wallet,
            discovery: { enabled:false, asLocalhost: true }
        };

        // Connect to gateway using application specified parameters
        console.log('Connect to Fabric gateway.');
        await gateway.connect(connectionProfile, connectionOptions);

        // Access LimeCare network
        console.log('Use network channel: mychannel.');
        const network = await gateway.getNetwork('mychannel');

        // Get addressability to medicine contract
        console.log('Use org.limecare.medicine smart contract.');
        const contract = await network.getContract('medcontract', 'org.limecare.medicine');

        // get commercial med
        console.log('Submit medicine getMeds transaction.');
        const getMedResponse = await contract.evaluateTransaction('getMeds', 'LabInc', '00001');

        // process response
        console.log('Process getmed transaction response.');
        let medJSON = JSON.parse(getMedResponse);
        let med = Medicine.createInstance(medJSON.issuer, medJSON.medNumber, medJSON.issueDateTime, medJSON.maturityDateTime, medJSON.faceValue);
        med.setOwner(medJSON.owner);
        med.currentState = medJSON.currentState;

        // let med = Commercialmed.fromBuffer(getmedResponse);
        let medState = 'Unknown';
        if(med.isIssued()) {
            medState = 'ISSUED';
        } else if(med.isTrading()){
            medState = 'TRADING';
        } else if(med.isRedeemed()){
            medState = 'REDEEMED';
        }

        console.log(` +--------- med Retrieved ---------+ `);
        console.log(` | med number: "${med.medNumber}"`);
        console.log(` | med is owned by: "${med.owner}"`);
        console.log(` | med is currently: "${medState}"`);
        console.log(` | med face value: "${med.faceValue}"`);
        console.log(` | med is issued by: "${med.issuer}"`);
        console.log(` | med issue on: "${med.issueDateTime}"`);
        console.log(` | med matures on: "${med.maturityDateTime}"`);
        console.log(` +-----------------------------------+ `);
        console.log('Transaction complete.');

        //console.log('Transaction complete.' + JSON.stringify(med));
    } catch (error) {
        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);
    } finally {
        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.')
        gateway.disconnect();
    }
}
main().then(() => {
    console.log('getmed program complete.');
}).catch((e) => {
    console.log('getmed program exception.');
    console.log(e);
    console.log(e.stack);
    process.exit(-1);
});
