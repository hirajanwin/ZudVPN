import React, { useState, useCallback } from 'react';
import { Alert, Text, SafeAreaView, ScrollView, FlatList, RefreshControl } from 'react-native';
import { Navigation } from 'react-native-navigation';
import RNNetworkExtension from 'react-native-network-extension';
import { useStore } from '../../store/store';
import RenderServer from './render_server';
import useScreen from '../screen_hooks';
import withClient from '../../providers/with_client';
import { RenderProviderItem } from './render_provider_item';
import { AVAILABLE_PROVIDERS } from '../../providers';
import {Divider} from "react-native-elements";

const SettingsScreen = props => {
    const [servers, setServers] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [{ current_vpn_server }, { setCurrentVPNServer, setVPNStatus, setLog }] = useStore();
    const { SSHTerminalScreenModal } = useScreen();

    Navigation.events().registerNavigationButtonPressedListener(({ buttonId, componentId }) => {
        if (componentId === props.componentId && buttonId === 'done_button') {
            Navigation.dismissModal(props.componentId);
        }
    });

    const select = server => () => {
        console.log('selecting server ', server);
        setLog('Configuring VPN');
        setVPNStatus('Connecting');

        try {
            props.client.createServer(server.provider.id, server.region);
            setCurrentVPNServer(server);
        } catch (e) {
            setVPNStatus('Connect');
            setLog('Cannot create VPN server ', e);
        }

        Navigation.dismissModal(props.componentId);
    };

    const sshTerminal = (uid, ipv4_address) => () => {
        console.log('SSH connecting ', uid);
        SSHTerminalScreenModal(uid, ipv4_address);
    };

    const destroyConfirmed = uid => {
        const server = servers.filter(_server => _server.uid === uid);

        Promise.all([props.client.deleteServer(server[0]), RNNetworkExtension.remove()]);

        if (current_vpn_server !== null && current_vpn_server.uid === uid) {
            setCurrentVPNServer(null);
            setVPNStatus('Connect');
        }

        // remove deleted from servers
        setServers(servers.filter(_server => _server.uid !== uid));
    };

    const destroy = uid => () => {
        Alert.alert('Warning!', 'Are you sure you want to destroy this server? This action cannot be undone.', [
            {
                text: 'Destroy',
                onPress: () => destroyConfirmed(uid),
                style: 'destructive',
            },
            {
                text: 'Cancel',
                style: 'cancel',
            },
        ]);
    };

    const retrieveServers = async () => {
        try {
            const _servers = await props.client.getServers();

            setServers(_servers);
        } catch (e) {
            setLog('Cannot retrieve server list from provider ', e);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);

        retrieveServers().then(() => setRefreshing(false));
    }, [refreshing]);

    if (servers === null) {
        retrieveServers();

        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView
                style={{ flex: 1 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                {servers.length > 0 &&
                    servers.map(server => (
                        <RenderServer
                            key={server.uid}
                            server={server}
                            select={select}
                            destroy={destroy}
                            sshTerminal={sshTerminal}
                        />
                    ))}
                <Text style={{ fontSize: 12, padding: 15, paddingBottom: 2 }}>CLOUD PROVIDERS</Text>
                <Divider />
                <FlatList
                    data={AVAILABLE_PROVIDERS}
                    renderItem={({ item }) => <RenderProviderItem item={item} componentId={props.componentId} />}
                    keyExtractor={(item, index) => index.toString()}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

export default withClient(SettingsScreen);