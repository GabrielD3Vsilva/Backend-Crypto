const bitcoin = require('bitcoinjs-lib');
const bip39 = require('bip39');
const axios = require('axios');
const network = bitcoin.networks.bitcoin; // você pode mudar a rede se necessário

let myWallet = null;

function createWallet() {
  const mnemonic = bip39.generateMnemonic();
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bitcoin.bip32.fromSeed(seed, network);

  myWallet = root.derivePath("m/44'/0'/0'/0/0");
  return {
    address: bitcoin.payments.p2pkh({ pubkey: myWallet.publicKey, network }).address,
    publicKey: myWallet.publicKey.toString('hex'),
    privateKey: myWallet.toWIF(),
    mnemonic: mnemonic
  };
}

function recoverWallet(mnemonic) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bitcoin.bip32.fromSeed(seed, network);

  myWallet = root.derivePath("m/44'/0'/0'/0/0");
  return {
    address: bitcoin.payments.p2pkh({ pubkey: myWallet.publicKey, network }).address,
    publicKey: myWallet.publicKey.toString('hex'),
    privateKey: myWallet.toWIF()
  };
}

async function getBalance(address) {
  try {
    const response = await axios.get(`https://blockchain.info/q/addressbalance/${address}`);
    const balanceInSatoshi = response.data;
    return {
      balanceInSatoshi,
      balanceInBTC: balanceInSatoshi / 1e8
    };
  } catch (err) {
    console.error(err);
    throw new Error('Erro ao obter saldo');
  }
}

async function buildTransaction(toAddress, amountInBTC) {
  try {
    const psbt = new bitcoin.Psbt({ network });

    const fee = 10000; // Defina uma taxa fixa ou calcule uma taxa dinâmica
    const utxosResponse = await axios.get(`https://blockchain.info/unspent?active=${myWallet.publicKey.toString('hex')}`);
    const utxos = utxosResponse.data.unspent_outputs;

    let inputValue = 0;
    utxos.forEach(utxo => {
      inputValue += utxo.value;
      psbt.addInput({
        hash: utxo.tx_hash_big_endian,
        index: utxo.tx_output_n,
        nonWitnessUtxo: Buffer.from(utxo.script, 'hex')
      });
    });

    const amountInSatoshi = amountInBTC * 1e8;
    psbt.addOutput({
      address: toAddress,
      value: amountInSatoshi
    });

    // Troco (valor total de entrada - valor de saída - taxa)
    if (inputValue > amountInSatoshi + fee) {
      psbt.addOutput({
        address: myWallet.publicKey.toString('hex'), // Endereço de troco
        value: inputValue - amountInSatoshi - fee
      });
    }

    return psbt;
  } catch (err) {
    console.error(err);
    throw new Error('Erro ao construir a transação');
  }
}

function signTransaction(psbt) {
  try {
    psbt.signAllInputs(myWallet);
    psbt.finalizeAllInputs();
    return psbt.extractTransaction().toHex();
  } catch (err) {
    console.error(err);
    throw new Error('Erro ao assinar a transação');
  }
}

async function sendTransaction(signedTxHex) {
  try {
    const response = await axios.post('https://blockchain.info/pushtx', `tx=${signedTxHex}`);
    return response.data;
  } catch (err) {
    console.error(err);
    throw new Error('Erro ao enviar a transação');
  }
}

module.exports = {
  createWallet,
  recoverWallet,
  getBalance,
  buildTransaction,
  signTransaction,
  sendTransaction
};
