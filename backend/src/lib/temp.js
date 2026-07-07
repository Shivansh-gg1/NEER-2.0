const ee = require("@google/earthengine");
const privateKey = require("./credentials/service-account-key.json");
ee.data.AuthentateViaPrivateKey(privateKey, () => {
    console.log("Authenticated!");
});