import { Layout, Page, Button } from '@shopify/polaris';
import * as React from "react";
import store from 'store-js';

class Index extends React.Component {
  state = { open: false };

  constructor(props)  {
    super(props);
    props.API.socket.on('bulk', (msg) => console.log(msg))
  }

  render() {
    // console.log("here test", this.props.client);
    return (
    <Page
      primaryAction={{
        content: 'Select products',
        onAction: () => this.setState({ open: true }),
      }}
    >
      <Layout>
        <Button  onClick={() => this.props.API.fetch('private/test-post', 'POST', {job:'MAIL'})}>private post</Button>
        <Button  onClick={() =>  this.props.API.fetch('public/test/')}>public test</Button>
        <Button  onClick={() =>  this.props.API.socket.emit('bulk', JSON.stringify({job:'upload', data:"data"}))}>ping bulk</Button>
      </Layout>
    </Page>
  );
  }
}

export default Index;
