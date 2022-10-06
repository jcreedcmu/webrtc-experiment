import { Principal } from './principal';
import * as immer from 'immer';

import React from "react";
import ReactDOM from "react-dom";

type State = {
  inviteUrl: string,
  chatHistory: string,
  chatLine: string,
}

type Action =
  { t: "generateInvite", url: string };

type Props = {
  p: Principal,
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
      this.change(s => s.inviteUrl = url);
    });
  }

  chat(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    const line = this.state.chatLine;
    this.change(s => {
      s.chatHistory += line + "\n";
      s.chatLine = "";
    });
    const ch = this.props.p.glob.channel;
    if (ch != undefined) {
      ch.send(line);
    }
  }

  change(f: (s: State) => void) {
    this.setState(s => immer.produce(s, (s: State) => { f(s); }));
  }

  componentDidMount() {
    this.props.p.channelDataCb = (data) => {
      this.change(s => s.chatHistory += "> " + data + "\n");
    };
  }

  render() {

    const inviteSection: () => JSX.Element = () => {
      const inviteLink =
        this.state.inviteUrl ?
          (<a href={this.state.inviteUrl} target="_blank">Invite Link</a>) :
          (<span></span>);
      return <span>
        <button onClick={() => this.generateInvite()}>generate invite</button><br />
        Invite link: {inviteLink}<br />
        <br />
      </span>;
    }

    return <div>
      {inviteSection()}
      Chat: <br />
      < textarea readOnly rows={6} style={{ width: 400 }} id="chat" value={this.state.chatHistory} />
      <br />
      <form onSubmit={e => this.chat(e)}>
        <input autoComplete={'off'} id="line" style={{ width: 400 }}
          value={this.state.chatLine}
          onChange={e => { const v = e.target.value; this.change(s => s.chatLine = v); }}>
        </input>
      </form>
      <br />
    </div >;
  }
}

export function render(p: Principal) {
  const root = document.getElementById("root");
  ReactDOM.render(<App p={p} />, root);
}
