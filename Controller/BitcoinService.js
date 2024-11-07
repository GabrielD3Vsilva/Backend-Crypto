const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');

// Função para criar uma nova carteira
function createWallet() {
    const keyPair = bitcoin.ECPair.makeRandom();
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
    const privateKey = keyPair.toWIF();
    console.log("Carteira criada:");
    console.log({ address, privateKey });
    return { address, privateKey };
}

// Função para recuperar uma carteira a partir de uma chave privada
function recoverWallet(privateKeyWIF) {
    const keyPair = bitcoin.ECPair.fromWIF(privateKeyWIF);
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
    return { address, privateKey: privateKeyWIF };
}

// Função para verificar o saldo de um endereço
async function getBalance(address) {
    try {
        const response = await axios.get(`https://blockchain.info/q/addressbalance/${address}`);
        return { balanceInBTC: response.data / 1e8 }; // O saldo é retornado em satoshis
    } catch (error) {
        console.error("Erro ao consultar o saldo:", error.message);
        return { balanceInBTC: 0, message: "Não foi possível consultar o saldo. Por favor, envie alguns fundos para o endereço primeiro." };
    }
}

// Função para validar um endereço
function addressIsValid(address) {
    try {
        bitcoin.address.toOutputScript(address);
        return true;
    } catch (error) {
        return false;
    }
}

// Função para construir uma transação
async function buildTransaction(myWallet, toAddress, amountInBTC) {
    const keyPair = bitcoin.ECPair.fromWIF(myWallet.privateKey);
    try {
        const response = await axios.get(`https://blockchain.info/unspent?active=${myWallet.address}`);
        const utxos = response.data.unspent_outputs.map(output => ({
            txId: output.tx_hash,
            vout: output.tx_output_n,
            value: output.value
        }));

        const psbt = new bitcoin.Psbt();
        utxos.forEach(utxo => psbt.addInput({ hash: utxo.txId, index: utxo.vout }));
        psbt.addOutput({ address: toAddress, value: amountInBTC * 1e8 });
        psbt.addOutput({ address: myWallet.address, value: utxos.reduce((sum, utxo) => sum + utxo.value, 0) - amountInBTC * 1e8 - 10000 }); // Subtraindo uma taxa de 10,000 satoshis

        utxos.forEach((utxo, i) => psbt.signInput(i, keyPair));
        psbt.validateSignaturesOfAllInputs();
        psbt.finalizeAllInputs();

        return psbt.extractTransaction().toHex();
    } catch (error) {
        console.error("Erro ao construir a transação:", error.message);
        return null;
    }
}

// Função para enviar uma transação
async function sendTransaction(transactionHex) {
    try {
        const response = await axios.post('https://blockchain.info/pushtx', `tx=${transactionHex}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao enviar a transação:", error.message);
        return null;
    }
}

module.exports = {
    createWallet,
    recoverWallet,
    getBalance,
    addressIsValid,
    buildTransaction,
    sendTransaction
};
