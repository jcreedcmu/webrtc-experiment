import { Principal } from './principal';

import React from "react";
import ReactDOM from "react-dom";

type State = {
  inviteUrl: string,
  chatHistory: string,
  chatLine: string,
}

export type Cbks = {
  generateInvite: (e: React.MouseEvent<HTMLButtonElement>, s: State) => State, // p.aliceStage1()
  chatFn: (e: React.FormEvent<HTMLFormElement>, s: State) => State, // p.chatLine(event);"
};

type Action =
  { t: "generateInvite", url: string };

type Props = {
  p: Principal,
  //  dispatch: (a: Action) => void,
}

class App extends React.Component<Props> {
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      inviteUrl: null,
      chatHistory: "",
      chatLine: "",
    }
  }

  generateInvite() {
    this.props.p.aliceStage1(url => {
      this.state.inviteUrl = url;
      this.setState(this.state);
    });
  }

  chat(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    this.state.chatHistory += this.state.chatLine + "\n";
    this.state.chatLine = "";
    this.setState(this.state);
  }

  render() {
    const inviteLink =
      this.state.inviteUrl ?
        (<a href={this.state.inviteUrl} target="_blank">Invite Link</a>) :
        (<span></span>);
    return <div>
      <button onClick={() => this.generateInvite()}>generate invite</button><br />
      Invite link: {inviteLink}<br />
      <br />
      Chat:<br />
      <textarea rows={6} style={{ width: 400 }} id="chat" value={this.state.chatHistory} />
      <br />
      <form onSubmit={e => this.chat(e)}>
        <input id="line" style={{ width: 400 }}
          value={this.state.chatLine}
          onChange={(e) => {
            this.state.chatLine = e.target.value;
            this.setState(this.state);
          }}></input>
      </form>
      <br />
    </div >;
  }
}

export function render(p: Principal) {
  const root = document.getElementById("root");
  ReactDOM.render(<App p={p} />, root);
}
