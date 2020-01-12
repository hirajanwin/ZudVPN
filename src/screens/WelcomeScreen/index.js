import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { RoundButton, IconButton } from './buttons';
import { useStore } from '../../store/store';
import useScreen from '../screen_hooks';
import Layout from './layout';
import withInitState from '../../store/init_state';

const Welcome = () => {
    const [{ provider_tokens, current_vpn_server, vpn_status, logs }, { triggerVPN }] = useStore();
    const { ProviderRegisterScreenModal, ServerSelectScreenModel, LogFileViewerScreenModal } = useScreen();

    if (provider_tokens.length === 0) {
        return (
            <Layout>
                <RoundButton label={'Get Started!'} onPress={ProviderRegisterScreenModal} />
            </Layout>
        );
    }

    let disabled = vpn_status === 'Connecting' || vpn_status === 'Disconnecting';

    let button_label = vpn_status;
    switch (vpn_status) {
        case 'Connected':
            button_label = 'Disconnect';
            break;
        case 'Disconnected':
            button_label = 'Connect';
            break;
    }

    const currentServer = () => {
        if (current_vpn_server) {
            return <IconButton label={current_vpn_server.name} onPress={ServerSelectScreenModel} />;
        }

        return null;
    };

    const triggerVPNorAddServer = () => {
        if (current_vpn_server) {
            triggerVPN();
        } else {
            ServerSelectScreenModel();
        }
    };

    return (
        <Layout>
            <RoundButton label={button_label} onPress={triggerVPNorAddServer} disabled={disabled} />
            <View style={{ marginTop: 10, marginBottom: 10 }}>{currentServer()}</View>
            <View>
                <TouchableOpacity onPress={LogFileViewerScreenModal}>
                    {logs.map((log, index) => (
                        <Text selectable={true} key={index}>
                            {log}
                        </Text>
                    ))}
                </TouchableOpacity>
            </View>
        </Layout>
    );
};

export default withInitState(Welcome);
