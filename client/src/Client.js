import React from "react";
import socket from "socket.io-client";
import { Scryfall } from "scryfall";
import { useParams } from "react-router";

function App() {
  const { id } = useParams();

  const [connected, setConnected] = React.useState(false);
  const [card, setCard] = React.useState(null);

  React.useEffect(() => {
    const websocket = socket();
    websocket.on("connect", () => {
      setConnected(true);
      websocket.emit("register", id);
    });

    websocket.on("card.id", (id) => {
      Scryfall.getCard(id, (err, card) => {
        if (err) {
          setCard(null);
        } else {
          setCard(card);
        }
      });
    });

    websocket.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      websocket.emit("unregister", id);
      websocket.disconnect();
    };
  }, [id]);
  return (
    <div className="App">
      <header className="App-header">
        {!connected && <h1>We are not connected!</h1>}
      </header>
      {card && (
        <img
          src={card.image_uris.normal}
          alt={card.name}
          title={card.name}
        ></img>
      )}
    </div>
  );
}

export default App;
