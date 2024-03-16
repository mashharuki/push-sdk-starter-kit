import * as PushAPI from '@pushprotocol/restapi';
import { NotificationItem, SubscribedModal, chainNameType } from '@pushprotocol/uiweb';
import { ethers } from 'ethers';
import { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { DarkIcon, LightIcon } from '../../components/icons';
import Loader from '../../components/loader';
import { Section, SectionButton, SectionItem } from '../../components/styled';
import { EnvContext, Web3Context } from '../../context';
import { getCAIPAddress } from '../../helpers';

const NotificationListContainer = styled.div`
  margin: 20px;
  padding: 20px;
  width: 100%;

  @media (max-width: 600px) {
    margin: 0;
    padding: 0;
  }
`

const TabButtons = styled.div`
  margin: 20px 0;
  display: flex;
  flex-direction: row;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const ThemeSelector = styled.div`
  display: flex;
  justify-content: flex-end;
  height: 32px;
`;

const NotificationsTest = () => {
  const { account, chainId, library } = useContext<any>(Web3Context);
  const { env, isCAIP } = useContext<any>(EnvContext);
  const [isLoading, setLoading] = useState(false);
  const [notifs, setNotifs] = useState<PushAPI.ParsedResponseType[]>();
  const [spams, setSpams] = useState<PushAPI.ParsedResponseType[]>();
  const [theme, setTheme] = useState('dark');
  const [viewType, setViewType] = useState('notif');
  const [showSubscribe, setShowSubscribe] = useState(false);

  /**
   * 通知を読み込むところ。
   */
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const feeds = await PushAPI.user.getFeeds({
        user: isCAIP ? getCAIPAddress(env, account) : account,
        // user: isCAIP ? getCAIPAddress(env, devWorkingAddress) : devWorkingAddress,
        limit: 30,
        env: env
      });

      console.log('feeds: ', feeds);

      setNotifs(feeds);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [account, env, isCAIP]);

  /**
   * スパムを読み込む
   */
  const loadSpam = useCallback(async () => {
    try {
      setLoading(true);
      const spams = await PushAPI.user.getFeeds({
        user: isCAIP ? getCAIPAddress(env, account) : account,
        spam: true,
        env: env
      });

      setSpams(spams);
  
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [account, env, isCAIP]);

  const toggleTheme = () => {
    setTheme(lastTheme => {
      return lastTheme === 'dark' ? 'light' : 'dark'
    })
  };

  /***
   * 通知を送信するメソッド(サンプル)
   */
  const sendNotification = async() => {
    // signer obを読み込む
    const _signer = library.getSigner(account);
    // senderを別のアカウントにする(接続先のRPCエンドポイントも別にしてみる。)
    const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_SEPOLIA_URL!);
    const signer = new ethers.Wallet(process.env.REACT_APP_PRIVATE_KEY!);
    // connect
    signer.connect(provider);
    
    // 通知を送る。
    const apiResponse = await PushAPI.payloads.sendNotification({
      signer: signer,
      type: 3, // target
      identityType: 2, // direct payload
      notification: {
        title: `[SDK-TEST] notification TITLE:`,
        body: `[sdk-test] notification BODY!!!!`
      },
      payload: {
        title: `[sdk-test] payload title`,
        body: `sample msg body!!!!!!`,
        cta: '',
        img: ''
      },
      recipients: 'eip155:11155111:0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072', // recipient address
      channel: 'eip155:11155111:0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072', // your channel address
      env: 'staging'
    });

    console.log("send noti:", apiResponse);
  };

  const toggleSubscribedModal = () => {
    setShowSubscribe((lastVal) => !lastVal);
  };


  useEffect(() => {
    if (account) {
      if (viewType === 'notif') {
        loadNotifications();
      } else {
        loadSpam();
      }
    }
  }, [account, viewType, loadNotifications, loadSpam]);

  return (
      <div>
        <Header>
          <h2>Notifications Test page</h2>

          {/* <TestModal /> */}
          
          <ThemeSelector>
            {theme === 'dark' ? <DarkIcon title="Dark" onClick={toggleTheme}/> : <LightIcon title="Light" onClick={toggleTheme}/>}
          </ThemeSelector>
        </Header>
                
        <TabButtons>
          <SectionButton onClick={() => { setViewType('notif') }}>Notifications</SectionButton>
          <SectionButton onClick={() => { setViewType('spam') }}>Spam</SectionButton>
          <SectionButton onClick={toggleSubscribedModal}>show subscribed modal</SectionButton>
          <SectionButton onClick={sendNotification}>Send Sample Notifications</SectionButton>
        </TabButtons>

        <Loader show={isLoading} />

        {showSubscribe ? <SubscribedModal onClose={toggleSubscribedModal}/> : null}

        <Section theme={theme}>
          {viewType === 'notif' ? (
            <>
            <b className='headerText'>Notifications: </b>
            <SectionItem>
              {notifs ? (
                <NotificationListContainer>
                  {notifs.map((oneNotification, i) => {
  
                  const { 
                    cta,
                    title,
                    message,
                    app,
                    icon,
                    image,
                    url,
                    blockchain,
                    secret,
                    notification
                  } = oneNotification;

                  // const chainName = blockchain as chainNameType;

                  return (
                    <NotificationItem
                      key={`notif-${i}`}
                      notificationTitle={secret ? notification['title'] : title}
                      notificationBody={secret ? notification['body'] : message}
                      cta={cta}
                      app={app}
                      icon={icon}
                      image={image}
                      url={url}
                      theme={theme}
                      // chainName="ETH_TEST_KOVAN"
                      chainName={blockchain as chainNameType}
                    />
                  );
                })}
                </NotificationListContainer>
              ) : null}
            </SectionItem>
            </>

          ) : (
            <>
              <b className='headerText'>Spams: </b>
              <SectionItem>
              {spams ? (
                <NotificationListContainer>
                  {spams.map((oneNotification, i) => {
                  const { 
                    cta,
                    title,
                    message,
                    app,
                    icon,
                    image,
                    url,
                    blockchain,
                    secret,
                    notification
                  } = oneNotification;

                  return (
                    <NotificationItem
                      key={`spam-${i}`}
                      notificationTitle={secret ? notification['title'] : title}
                      notificationBody={secret ? notification['body'] : message}
                      cta={cta}
                      app={app}
                      icon={icon}
                      image={image}
                      url={url}
                      // optional parameters for rendering spambox
                      isSpam
                      subscribeFn={async () => console.log("yayy spam")}
                      isSubscribedFn={async () => false}
                      theme={theme}
                      chainName={blockchain as chainNameType}
                    />
                  );
                })}
                </NotificationListContainer>
              ) : null}
              </SectionItem>
            </>

          )}
        </Section>

      </div>
  );
}

export default NotificationsTest;