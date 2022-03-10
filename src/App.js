import * as React from 'react';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import abi from './utils/WavePortal.json';
import './App.css';

export default function App() {
  const [currentAccount, setCurrentAccount] = useState('');
  const [messageValue, setMessageValue] = useState('');
  const [allWaves, setAllWaves] = useState([]);

  console.log('currentAccount: ', currentAccount);

  const contractAddress = '0xEe1C3c1b2757eDA0723cC9b289816d2E77AE2488';
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map((wave) => ({
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message,
        }));

        setAllWaves(wavesCleaned);
      } else {
        console.log('Ethereum object does not exist!');
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log('NewWave', from, timestamp, message);

      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message,
        }
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on('NewWave', onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    };
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log('Make sure you have MetaMask!');
      } else {
        console.log('We have the ethereum object', ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log('Found an authorized account:', account);
        setCurrentAccount(account);
      } else {
        console.log('No authorized account found');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Please get Metamask.');
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Connected: ', accounts[0]);
      setCurrentAccount(accounts[0])
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        // ここで、コントラクトへの接続を行っています。
        // コントラクトの新しいインスタンスを作成するには、以下3つの変数を ethers.Contract 関数に渡す必要があります。
        // コントラクトインスタンスでは、コントラクトに格納されているすべての関数を呼び出すことができます。
        // ※ もしこのコントラクトインスタンスに provider を渡すと、そのインスタンスは読み取り専用の機能しか実行できなくなります。一方、signer を渡すと、そのインスタンスは読み取りと書き込みの両方の機能を実行できるようになります。
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer); // (コントラクトのデプロイ先のアドレス（ローカル、テストネット、またはメインネット）, コントラクトの ABI, provider => read機能 もしくは signer => read機能, write機能)

        let count = await wavePortalContract.getTotalWaves();
        console.log('Retrieved total wave count...', count.toNumber());

        const waveTxn = await wavePortalContract.wave(messageValue, { gasLimit: 300000 });
        console.log('Mining...', waveTxn.hash);
        await waveTxn.wait();
        console.log('Mined --', waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log('Retrieved total wave count...', count.toNumber());
      } else {
        console.log('Ethereum object does not exist!');
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <span role="img" aria-label="hand-wave">👋</span> WELCOME!
        </div>

        <div className="bio">
          イーサリアムウォレットを接続して、メッセージを作成したら、<span role="img" aria-label="hand-wave">👋</span>を送ってください<span role="img" aria-label="shine">✨</span>
        </div>

        {
          currentAccount && (
            <textarea
              name="messageArea"
              placeholder="メッセージはこちら"
              type="text"
              id="message"
              value={messageValue}
              onChange={e => setMessageValue(e.target.value)}
            />
          )
        }

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {
          !currentAccount && (
            <button type="button" className="waveButton" onClick={connectWallet}>
              Connect Wallet
            </button>
          )
        }

        {
          currentAccount && (
            <button type="button" className="waveButton" onClick={connectWallet}>
              Wallet Connected
            </button>
          )
        }

        {
          currentAccount && (
            allWaves.slice(0).reverse().map((wave, index) => (
              <div key={index} style={{ backgroundColor: '#f8f8f8', marginTop: '16px', padding: '8px' }}>
                <div>Address: {wave.address}</div>
                <div>Time: {wave.timestamp.toString()}</div>
                <div>Message: {wave.message}</div>
              </div>
            ))
          )
        }
      </div>
    </div>
  );
}
