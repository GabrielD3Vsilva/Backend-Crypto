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
    const response = await axios.get(`https://blockchain.info/q/addressbalance/${address}`);
    return { balanceInBTC: response.data / 1e8 }; // O saldo é retornado em satoshis
}

// Função para validar um endereço
function addressIsValid(address) {
    bitcoin.address.toOutputScript(address);
    return true;
}

// Função para construir uma transação
async function buildTransaction(myWallet, toAddress, amountInBTC) {
    const keyPair = bitcoin.ECPair.fromWIF(myWallet.privateKey);
    const response = await axios.get(`https://blockchain.info/unspent?active=${myWallet.address}`); const utxos = response.data.unspent_outputs.map(output => ({ txId: output.tx_hash, vout: output.tx_output_n, value: output.value })); const totalValue = utxos.reduce((sum, utxo) => sum + utxo.value, 0); const amountInSatoshis = amountInBTC * 1e8; const fee = 10000; 
    if (amountInSatoshis + fee > totalValue) 
        { console.error("Saldo insuficiente para a transação."); return null; } const psbt = new bitcoin.Psbt(); utxos.forEach(utxo => psbt.addInput({ hash: utxo.txId, index: utxo.vout })); psbt.addOutput({ address: toAddress, value: amountInSatoshis }); psbt.addOutput({ address: myWallet.address, value: totalValue - amountInSatoshis - fee }); 
    
    utxos.forEach((utxo, i) => psbt.signInput(i, keyPair)); psbt.validateSignaturesOfAllInputs(); psbt.finalizeAllInputs(); 
    
    return psbt.extractTransaction().toHex();
}

// Função para enviar uma transação
async function sendTransaction(transactionHex) {
    const response = await axios.post('https://blockchain.info/pushtx', `tx=${transactionHex}`);
    return response.data;
}

module.exports = {
    createWallet,
    recoverWallet,
    getBalance,
    addressIsValid,
    buildTransaction,
    sendTransaction
};
