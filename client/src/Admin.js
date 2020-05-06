import React, { useEffect } from "react";
import socket from "socket.io-client";
import {
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  Paper,
  TableContainer,
  TableCell,
  Icon,
  TableBody,
} from "@material-ui/core";
import { Link, useParams } from "react-router-dom";

import { from, timer, merge as mergeStatic } from "rxjs";
import { concatMap, ignoreElements } from "rxjs/operators";

const fetchCard = async (name) => {
  const card = name.match(/^(?:\d*) ([a-zA-Z,' ]+)/);
  if (!card || !card[1]) return null;
  const cardName = encodeURIComponent(card[1].toLowerCase());
  const data = await fetch(
    `https://api.scryfall.com/cards/named?exact=${cardName}`
  ).then((res) => res.json());
  return data;
};
let websocket = null;

function App(props) {
  const { id } = useParams();

  const [rawDeck, setRawDeck] = React.useState("");
  const [decklist, setDecklist] = React.useState([]);
  const parseDecklist = async (decklist) => {
    const parsedDecklist = decklist.split("\n").filter((line) => !!line);
    from(parsedDecklist)
      .pipe(
        concatMap((url) =>
          mergeStatic(fetchCard(url), timer(150).pipe(ignoreElements()))
        )
      )
      .subscribe((data) => {
        if (!data) return;
        setDecklist((decklist) => [...decklist, data]);
      });
  };

  const push = (cardId) => {
    if (websocket === null || websocket.disconnected) return;
    websocket.emit("card.push", cardId);
  };

  useEffect(() => {
    websocket = socket();
    websocket.on("connect", () => {
      websocket.emit("register", id);
    });
  }, [id]);

  useEffect(() => {
    try {
      const storedDecklist = JSON.parse(window.localStorage.getItem(id));
      setDecklist(storedDecklist || []);
    } catch (e) {
      console.error("Old decklist seems broken, deleting it");
      window.localStorage.removeItem(id);
    }
  }, [id]);

  useEffect(() => {
    window.localStorage.setItem(id, JSON.stringify(decklist));
  }, [id, decklist]);

  return (
    <div className="App">
      {!decklist.length && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            parseDecklist(rawDeck);
          }}
        >
          <div>
            <Button type="submit" variant="contained" color="primary">
              Submit
            </Button>
          </div>
          <div>
            <TextField
              helperText={"Paste your decklist here"}
              variant="outlined"
              multiline={true}
              label="Decklist"
              value={rawDeck}
              onChange={(e) => setRawDeck(e.target.value)}
            ></TextField>
          </div>
        </form>
      )}

      {decklist.length > 0 && (
        <article>
          <h1>Decklist Loaded!</h1>
          <h2>
            <Link to={`/view/${id}`} target="_blank">
              Your Preview Link
            </Link>
          </h2>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setDecklist([])}
          >
            Reset
          </Button>
          <hr />
          <DecklistView
            decklist={decklist}
            onClick={(id) => push(id)}
          ></DecklistView>
        </article>
      )}
      <Trademark style={{ maxWidth: 600, fontSize: 10 }} />
    </div>
  );
}

const DecklistView = ({ decklist, onClick }) => {
  const [quicksearch, setQuicksearch] = React.useState("");

  return (
    <Paper>
      <TableContainer style={{ maxHeight: "88vh" }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell colSpan="2">
                <TextField
                  style={{ width: "100%" }}
                  helperText="Search for Card name"
                  value={quicksearch}
                  onChange={(e) => setQuicksearch(e.target.value)}
                ></TextField>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>CardName</TableCell>
              <TableCell>Show</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {decklist
              .filter((card) =>
                card.name.toLowerCase().includes(quicksearch.toLowerCase())
              )
              .map((card) => {
                return (
                  <TableRow key={card.id}>
                    <TableCell>{card.name}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => onClick(card.id)}
                        color="primary"
                        variant="contained"
                      >
                        <Icon>visibility</Icon>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

const Trademark = (props) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={props.style || {}}>
      obs-display-cards © 2020. All rights reserved.
      <br />
      Wizards of the Coast, Magic: The Gathering, and their logos are trademarks
      of Wizards of the Coast LLC in the United States and other countries. ©
      2009 Wizards.
      <button
        style={{
          outline: "none",
          border: "none",
          backgroundColor: "transparent",
          color: "blue",
          textDecoration: "underline",
          cursor: "pointer",
          fontSize: 10,
        }}
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
      >
        show more...
      </button>
      {open && (
        <p>
          All Rights Reserved. This web site is not affiliated with, endorsed,
          sponsored, or specifically approved by Wizards of the Coast LLC. This
          web site may use the trademarks and other intellectual property of
          Wizards of the Coast LLC, which is permitted under Wizards' Fan Site
          Policy. For example, MAGIC: THE GATHERING(r) is a trademark of Wizards
          of the Coast. For more information about Wizards of the Coast or any
          of Wizards' trademarks or other intellectual property, please visit
          their website at{" "}
          <a
            href="https://www.wizards.com"
            rel="noopener noreferrer"
            target="_blank"
            alt="Wizards.com"
          >
            (www.wizards.com)
          </a>
          . All information is subject to change without prior notice. Although
          we try to present current and accurate information, we cannot make any
          guarantees of any kind. Responsibility for comments, forum posts,
          messages and any other user-generated content lies with their
          respective authors. We do not monitor or necessarily agree with any
          personal opinions or other expressions published in any such content.
        </p>
      )}
    </div>
  );
};

export default App;
