import {Image, preloadShopQuery} from '@shopify/hydrogen';
import gql from 'graphql-tag';

import {Localization} from '@shopify/hydrogen/dist/esnext/graphql/graphql-constants';

export function preloadPageQueries() {
  preloadShopName();
  preloadLayoutQuery();
  preloadLocalization();
}

function preloadShopName() {
  preloadShopQuery({
    query: SHOPNAME_QUERY,
    cache: {maxAge: 60 * 60 * 12, staleWhileRevalidate: 60 * 60 * 12},
  });
}

const SHOPNAME_QUERY = gql`
  query shopName {
    shop {
      name
    }
  }
`;

function preloadLocalization() {
  preloadShopQuery({
    query: Localization,
    cache: {maxAge: 60 * 60, staleWhileRevalidate: 60 * 60 * 23},
  });
}

function preloadLayoutQuery() {
  preloadShopQuery({
    query: LAYOUT_QUERY,
    variables: {
      numCollections: 3,
    },
    cache: {
      maxAge: 60,
      staleWhileRevalidate: 60 * 10,
    },
  });
}

const LAYOUT_QUERY = gql`
  query layoutContent($numCollections: Int!) {
    shop {
      name
    }
    collections(first: $numCollections) {
      edges {
        node {
          description
          handle
          id
          title
          image {
            ...ImageFragment
          }
        }
      }
    }
    products(first: 1) {
      edges {
        node {
          handle
        }
      }
    }
  }
  ${Image.Fragment}
`;
