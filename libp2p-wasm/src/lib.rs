use std::str::FromStr;
use std::time::Duration;
use wasm_bindgen::prelude::wasm_bindgen;
use wasm_bindgen_futures::{spawn_local, JsFuture};

use libp2p::core::either::EitherTransport;
use libp2p::core::muxing::StreamMuxerBox;
use libp2p::core::transport;
use libp2p::core::upgrade::Version;
use libp2p::futures::select;
use libp2p::futures::StreamExt;
use libp2p::identify::{Identify, IdentifyConfig, IdentifyEvent};
use libp2p::mplex::MplexConfig;
use libp2p::swarm::NetworkBehaviourEventProcess;
pub use libp2p::wasm_ext::ffi::websocket_transport;
pub use libp2p::wasm_ext::ffi::{Connection, ConnectionEvent, ListenEvent};
use libp2p::wasm_ext::ExtTransport;
use libp2p::yamux::YamuxConfig;
use libp2p::{identity, noise, Multiaddr, NetworkBehaviour, PeerId, Swarm, Transport};
use libp2p::swarm::SwarmEvent;
use wasm_bindgen::throw_str;
use wasm_rs_dbg::dbg;

pub const PROTOCOL_NAME: &'static str = "/fluence/particle/2.0.0";


#[wasm_bindgen]
pub fn test() {
    console_error_panic_hook::set_once();

    spawn_local(async move {
        // Create a Swarm to manage peers and events
        // Create a random PeerId
        let local_key = identity::Keypair::generate_ed25519();
        let local_peer_id = PeerId::from(local_key.public());
        println!("using random peer id: {:?}", local_peer_id);

        let transport = build_transport(local_key.clone());

        let mut swarm = {
            let mut behaviour = MyBehaviour {
                identify: Identify::new(IdentifyConfig::new(
                    PROTOCOL_NAME.into(),
                    local_key.public(),
                )),
            };

            Swarm::new(transport, behaviour, local_peer_id)
        };
        let event = swarm.select_next_some();

        let addr = Multiaddr::from_str("/dns4/kras-00.fluence.dev/tcp/19990/wss/p2p/12D3KooWSD5PToNiLQwKDXsu8JSysCwUt8BVUJEqCHcDe7P5h45e")
            .unwrap_or_else(|_| panic!("failed to parse multiaddr"));
        swarm.dial(addr).unwrap_or_else(|_| panic!("failed to dial"));
        dbg!("dial succeed");
        loop {
            select! {
                event = swarm.select_next_some() => {
                    if let SwarmEvent::NewListenAddr { address, .. } = event {
                        dbg!("Listening on {:?}", address);
                    } else {

                    }
                }
            }
        }
    })
}

/// Builds the transport that serves as a common ground for all connections.
pub fn build_transport(key_pair: identity::Keypair) -> transport::Boxed<(PeerId, StreamMuxerBox)> {
    let noise_keys = noise::Keypair::<noise::X25519Spec>::new()
        .into_authentic(&key_pair)
        .unwrap();
    let noise_config = noise::NoiseConfig::xx(noise_keys).into_authenticated();
    let mplex_config = MplexConfig::default();

    let ws = ExtTransport::new(websocket_transport());
    let base = Transport::boxed(ws);
    base.upgrade(Version::V1)
        .authenticate(noise_config)
        .multiplex(mplex_config)
        .timeout(Duration::from_secs(20))
        .boxed()
}

#[derive(NetworkBehaviour)]
#[behaviour(event_process = true)]
struct MyBehaviour {
    identify: Identify,
}

impl NetworkBehaviourEventProcess<IdentifyEvent> for MyBehaviour {
    // Called when `identify` produces an event.
    fn inject_event(&mut self, event: IdentifyEvent) {
        println!("identify: {:?}", event);
    }
}
