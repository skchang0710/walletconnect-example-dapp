import * as React from "react";
import styled from "styled-components";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Button from "./components/Button";
import Column from "./components/Column";
import Wrapper from "./components/Wrapper";
import Modal from "./components/Modal";
import Header from "./components/Header";
import Loader from "./components/Loader";
import { fonts } from "./styles";
import { sanitizeHex, verifySignature, hashPersonalMessage } from "./helpers/utilities";
import { convertStringToHex } from "./helpers/bignumber";
import { IAssetData } from "./helpers/types";
import Banner from "./components/Banner";
import AccountAssets from "./components/AccountAssets";
import Web3 from "web3";

const SLayout = styled.div`
  position: relative;
  width: 100%;
  /* height: 100%; */
  min-height: 100vh;
  text-align: center;
`;

const SContent = styled(Wrapper as any)`
  width: 100%;
  height: 100%;
  padding: 0 16px;
`;

const SLanding = styled(Column as any)`
  height: 600px;
`;

const SButtonContainer = styled(Column as any)`
  width: 250px;
  margin: 50px 0;
`;

const SConnectButton = styled(Button as any)`
  border-radius: 8px;
  font-size: ${fonts.size.medium};
  height: 44px;
  width: 100%;
  margin: 12px 0;
`;

const SContainer = styled.div`
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  word-break: break-word;
`;

const SModalContainer = styled.div`
  width: 100%;
  position: relative;
  word-wrap: break-word;
`;

const SModalTitle = styled.div`
  margin: 1em 0;
  font-size: 20px;
  font-weight: 700;
`;

const SModalParagraph = styled.p`
  margin-top: 30px;
`;

// @ts-ignore
const SBalances = styled(SLanding as any)`
  height: 100%;
  & h3 {
    padding-top: 30px;
  }
`;

const STable = styled(SContainer as any)`
  flex-direction: column;
  text-align: left;
`;

const SRow = styled.div`
  width: 100%;
  display: flex;
  margin: 6px 0;
`;

const SKey = styled.div`
  width: 30%;
  font-weight: 700;
`;

const SValue = styled.div`
  width: 70%;
  font-family: monospace;
`;

const STestButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
`;

const STestButton = styled(Button as any)`
  border-radius: 8px;
  font-size: ${fonts.size.medium};
  height: 44px;
  width: 100%;
  max-width: 175px;
  margin: 12px;
`;

interface IAppState {
  fetching: boolean;
  chainId: number;
  showModal: boolean;
  pendingRequest: boolean;
  uri: string;
  address: string;
  result: any | null;
  assets: IAssetData[];
}

const INITIAL_STATE: IAppState = {
  fetching: false,
  chainId: 1,
  showModal: false,
  pendingRequest: false,
  uri: "",
  address: "",
  result: null,
  assets: [],
};

let web3: Web3;
let provider: any;

class App extends React.Component<any, any> {
  public state: IAppState = {
    ...INITIAL_STATE,
  };

  public walletConnectInit = async () => {
    //  Create WalletConnect Provider
    provider = new WalletConnectProvider({
      infuraId: "cbc3aeaa42454c1cb5182d71376c0872", // Required
    });

    web3 = new Web3(provider);
    console.log("web3 :", web3);

    provider.on("accountsChanged", async (accounts: string[]) => {
      console.log("accountsChanged :", accounts);
      const address = accounts[0];
      await this.setState({ address });
      await this.getAccountAssets();
    });

    provider.on("chainChanged", async (chainId: number) => {
      console.log("chainChanged :", chainId);
      await this.setState({ chainId });
      await this.getAccountAssets();
    });

    provider.on("connect", () => {
      console.log("connect");
    });

    provider.on("disconnect", async (code: number, reason: string) => {
      console.log(code, reason);
      await this.setState({ ...INITIAL_STATE });
    });

    provider.enable();
  };

  public killSession = async () => {
    await provider.disconnect();
  };

  public getAccountAssets = async () => {
    const { address } = this.state;
    this.setState({ fetching: true });
    try {
      // get account balances
      const balance = await web3.eth.getBalance(address);
      const asset = {
        symbol: "ETH",
        name: "Ether",
        decimals: "18",
        contractAddress: "",
        balance,
      };
      console.log("asset :", asset);

      await this.setState({ fetching: false, address, assets: [asset] });
    } catch (error) {
      console.error(error);
      await this.setState({ fetching: false });
    }
  };

  public toggleModal = () => this.setState({ showModal: !this.state.showModal });

  public testSendTransaction = async () => {
    const { address } = this.state;

    if (!web3) {
      return;
    }

    // from
    const from = address;

    // to
    const to = address;

    // nonce
    const nonce = await web3.eth.getTransactionCount(address);
    console.log("nonce :", nonce);

    // gasPrice
    const gasPrice = await web3.eth.getGasPrice();
    console.log("gasPrice :", gasPrice);

    // gasLimit
    const _gasLimit = 21000;
    const gas = sanitizeHex(convertStringToHex(_gasLimit));

    // value
    const _value = 0;
    const value = sanitizeHex(convertStringToHex(_value));

    // data
    const data = "0x";

    // test transaction
    const tx = {
      from,
      to,
      nonce,
      gasPrice,
      gas,
      value,
      data,
    };

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send transaction
      const result = await web3.eth.sendTransaction(tx);

      // format displayed result
      const formattedResult = {
        method: "eth_sendTransaction",
        txHash: result,
        from: address,
        to: address,
        value: "0 ETH",
      };

      // display result
      this.setState({
        pendingRequest: false,
        result: formattedResult || null,
      });
    } catch (error) {
      console.error(error);
      this.setState({ pendingRequest: false, result: null });
    }
  };

  public testSignTransaction = async () => {
    const { address } = this.state;

    if (!web3) {
      return;
    }

    // from
    const from = address;

    // to
    const to = address;

    // nonce
    const nonce = await web3.eth.getTransactionCount(address);
    console.log("nonce :", nonce);

    // gasPrice
    const gasPrice = await web3.eth.getGasPrice();
    console.log("gasPrice :", gasPrice);

    // gasLimit
    const _gasLimit = 21000;
    const gas = sanitizeHex(convertStringToHex(_gasLimit));

    // value
    const _value = 0;
    const value = sanitizeHex(convertStringToHex(_value));

    // data
    const data = "0x";

    // test transaction
    const tx = {
      from,
      to,
      nonce,
      gasPrice,
      gas,
      value,
      data,
    };

    console.log("tx :", tx);

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // sign transaction
      const signedTransaction = await web3.eth.signTransaction(tx);
      console.log("signedTransaction :", signedTransaction);

      // format displayed result
      const formattedResult = {
        method: "eth_signTransaction",
        signedTransaction,
      };

      // display result
      this.setState({
        pendingRequest: false,
        result: formattedResult || null,
      });
    } catch (error) {
      console.error(error);
      this.setState({ pendingRequest: false, result: null });
    }
  };

  public testSignPersonalMessage = async () => {
    const { address, chainId } = this.state;

    if (!web3) {
      return;
    }

    // test message
    const message = "My email is john@doe.com - 1537836206101";

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send message
      const result = await web3.eth.personal.sign(message, address, "");

      // verify signature
      const hash = hashPersonalMessage(message);
      const valid = await verifySignature(address, result, hash, chainId);

      // format displayed result
      const formattedResult = {
        method: "personal_sign",
        address,
        valid,
        result,
      };

      // display result
      this.setState({
        pendingRequest: false,
        result: formattedResult || null,
      });
    } catch (error) {
      console.error(error);
      this.setState({ pendingRequest: false, result: null });
    }
  };

  public render = () => {
    const { assets, address, chainId, fetching, showModal, pendingRequest, result } = this.state;
    return (
      <SLayout>
        <Column maxWidth={1000} spanHeight>
          <Header
            connected={provider ? provider.connected : false}
            address={address}
            chainId={chainId}
            killSession={this.killSession}
          />
          <SContent>
            {!address && !assets.length ? (
              <SLanding center>
                <h3>
                  {`Try out WalletConnect`}
                  <br />
                  <span>{`v${process.env.REACT_APP_VERSION}`}</span>
                </h3>
                <SButtonContainer>
                  <SConnectButton left onClick={this.walletConnectInit} fetching={fetching}>
                    {"Connect to WalletConnect"}
                  </SConnectButton>
                </SButtonContainer>
              </SLanding>
            ) : (
              <SBalances>
                <Banner />
                <h3>Actions</h3>
                <Column center>
                  <STestButtonContainer>
                    <STestButton left onClick={this.testSendTransaction}>
                      {"eth_sendTransaction"}
                    </STestButton>

                    <STestButton left onClick={this.testSignTransaction}>
                      {"eth_signTransaction"}
                    </STestButton>

                    <STestButton left onClick={this.testSignPersonalMessage}>
                      {"personal_sign"}
                    </STestButton>
                  </STestButtonContainer>
                </Column>
                <h3>Balances</h3>
                {!fetching ? (
                  <AccountAssets chainId={chainId} assets={assets} />
                ) : (
                  <Column center>
                    <SContainer>
                      <Loader />
                    </SContainer>
                  </Column>
                )}
              </SBalances>
            )}
          </SContent>
        </Column>
        <Modal show={showModal} toggleModal={this.toggleModal}>
          {pendingRequest ? (
            <SModalContainer>
              <SModalTitle>{"Pending Call Request"}</SModalTitle>
              <SContainer>
                <Loader />
                <SModalParagraph>{"Approve or reject request using your wallet"}</SModalParagraph>
              </SContainer>
            </SModalContainer>
          ) : result ? (
            <SModalContainer>
              <SModalTitle>{"Call Request Approved"}</SModalTitle>
              <STable>
                {Object.keys(result).map(key => (
                  <SRow key={key}>
                    <SKey>{key}</SKey>
                    <SValue>{result[key].toString()}</SValue>
                  </SRow>
                ))}
              </STable>
            </SModalContainer>
          ) : (
            <SModalContainer>
              <SModalTitle>{"Call Request Rejected"}</SModalTitle>
            </SModalContainer>
          )}
        </Modal>
      </SLayout>
    );
  };
}

export default App;
