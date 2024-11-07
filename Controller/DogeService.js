const bitcore = require('bitcore-lib-doge');
const axios = require('axios');

// Função para criar uma nova carteira
function createWallet() {
    const privateKey = new bitcore.PrivateKey();
    const address = privateKey.toAddress();
    console.log("Carteira criada:");
    console.log({ address: address.toString(), privateKey: privateKey.toWIF() });
    return { address: address.toString(), privateKey: privateKey.toWIF() };
}

// Função para recuperar uma carteira a partir de uma chave privada
function recoverWallet(privateKeyWIF) {
    const privateKey = bitcore.PrivateKey.fromWIF(privateKeyWIF);
    const address = privateKey.toAddress();
    return { address: address.toString(), privateKey: privateKey.toWIF() };
}

// Função para verificar o saldo de um endereço
async function getBalance(address) {
    try {
        const response = await axios.get(`https://api.blockcypher.com/v1/doge/main/addrs/${address}/balance`);
        return { balanceInDoge: response.data.balance / 1e8 }; // O saldo na BlockCypher é retornado em satoshis
    } catch (error) {
        console.error("Erro ao consultar o saldo:", error.message);
        return { balanceInDoge: 0, message: "Não foi possível consultar o saldo. Por favor, envie alguns fundos para o endereço primeiro." };
    }
}

// Função para validar um endereço
function addressIsValid(address) {
    try {
        bitcore.Address.fromString(address);
        return true;
    } catch (error) {
        return false;
    }
}

// Função para construir uma transação
async function buildTransaction(myWallet, toWallet, amountInDoge) {
    const privateKey = bitcore.PrivateKey.fromWIF(myWallet.privateKey);
    try {
        const response = await axios.get(`https://api.blockcypher.com/v1/doge/main/addrs/${myWallet.address}?unspentOnly=true`);
        
        // Verificar se a propriedade txrefs existe na resposta
        if (!response.data.txrefs) {
            throw new Error("No unspent outputs found for the address.");
        }
        
        const utxos = response.data.txrefs.map(output => ({
            txId: output.tx_hash,
            outputIndex: output.tx_output_n,
            address: myWallet.address,
            script: bitcore.Script.buildPublicKeyHashOut(myWallet.address).toString(),
            satoshis: output.value
        }));
        
        const transaction = new bitcore.Transaction()
            .from(utxos)
            .to(toWallet, amountInDoge * 1e8)
            .change(myWallet.address)
            .sign(privateKey);
        
        return transaction.serialize();
    } catch (error) {
        console.error("Erro ao construir a transação:", error.message);
        return null;
    }
}




// Função para enviar uma transação
async function sendTransaction(transactionHex) {
    try {
        const response = await axios.post('https://api.blockcypher.com/v1/doge/main/txs/push', { tx: transactionHex });
        return response.data.tx.hash;
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
