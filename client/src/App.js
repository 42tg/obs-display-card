import React from "react";
import Admin from "./Admin";
import Client from "./Client";
import {
  BrowserRouter as Router,
  Redirect,
  Switch,
  Route,
} from "react-router-dom";

import { v4 as uuid } from "uuid";

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/view/:id">
          <Client />
        </Route>
        <Route path="/:id">
          <Admin />
        </Route>
        <Redirect exact from="/" to={`/${uuid()}`} />
      </Switch>
    </Router>
  );
};

export default App;
