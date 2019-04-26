import { Layout, Page, Button } from '@shopify/polaris';
import * as React from "react";
import store from 'store-js';
import {API, Socket } from './util/api'

const socket = Socket();

class Index extends React.Component {
  state = { open: false };

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
        <Button  onClick={() => API.fetch('private/test-post', 'POST', {job:'MAIL'})}>private post</Button>
        <Button  onClick={() =>  API.fetch('public/test/')}>public test</Button>
      </Layout>
    </Page>
  );
  }
}

export default Index;
