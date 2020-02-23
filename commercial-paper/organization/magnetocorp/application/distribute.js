/*
SPDX-License-Identifier: Apache-2.0
*/

/*
 * This application has 6 basic steps:
 * 1. Select an identity from a inventory
 * 2. Connect to network gateway
 * 3. Access LimeCare network
 * 4. Construct request to issue Medicine
 * 5. Submit transaction
 * 6. Process response
 */

'use strict';
// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const { FileSystemInventory, Gateway } = require('fabric-network');
const Medicine = require('../contract/lib/medicine.js');

// A inventory stores a collection of identities for use
//const inventory = new FileSysteminventory('../user/dibella/inventory');
const inventory = new FileSystemInventory('../identity/user/dibella/inventory');

// Main program function
async function main() {
    // A gateway defines the peers used to access Fabric networks
    const gateway = new Gateway();
    // Main try/catch block
    try {

        // Specify userName for network access
        // const userName = 'dibella.distributor@magnetocorp.com';
        const userName = 'User1@org1.example.com';

        // Load connection profile; will be used to locate a gateway
        let connectionProfile = yaml.safeLoad(fs.readFileSync('../gateway/networkConnection.yaml', 'utf8'));

        // Set connection options; identity and inventory
        let connectionOptions = {
            identity: userName,
            inventory: inventory,
            discovery: { enabled:false, asLocalhost: true }
        };

        // Connect to gateway using application specified parameters
        console.log('Connect to Fabric gateway.');

        await gateway.connect(connectionProfile, connectionOptions);
        // Access LimeCare network
        console.log('Use network channel: mychannel.');
        const network = await gateway.getNetwork('mychannel');
        // Get addressability to commercial medicne contract
        console.log('Use org.limeCare.medicine smart contract.');
        const contract = await network.getContract('medcontract');
        // issue commercial med
        console.log('Submit commercial med issue transaction.');

        const distributorResponse = await contract.submitTransaction('issue', 'MagnetoCorp', '00001', '2020-05-31', '2020-11-30', '5000000');
         // process response
        console.log('Process issue transaction response.'+distributorResponse);

        let med = Medicine.fromBuffer(distributorResponse);
        console.log(`${med.distributor} commercial med : ${med.medNumber} successfully issued for value ${med.faceValue}`);
        console.log('Transaction complete.');

    } catch (error) {
        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);
    } finally {
        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        gateway.disconnect();

    }
}
main().then(() => {

    console.log('Issue program complete.');

}).catch((e) => {

    console.log('Issue program exception.');
    console.log(e);
    console.log(e.stack);
    process.exit(-1);

});