import {
  ShopifyServerProvider,
  DefaultRoutes,
  preloadShopQuery,
  ProductProviderFragment,
  Image,
} from '@shopify/hydrogen';
import {Switch, useParams} from 'react-router-dom';
import {Suspense} from 'react';
import gql from 'graphql-tag';

import shopifyConfig from '../shopify.config';

import DefaultSeo from './components/DefaultSeo.server';
import NotFound from './components/NotFound.server';
import CartProvider from './components/CartProvider.client';
import LoadingFallback from './components/LoadingFallback';
import {preloadPageQueries} from './pages/preloadPageQueries';

export default function App({...serverState}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ShopifyServerProvider shopifyConfig={shopifyConfig} {...serverState}>
        <AppContent serverState={serverState} />
      </ShopifyServerProvider>
    </Suspense>
  );
}

function AppContent({serverState}) {
  const pages = import.meta.globEager('./pages/**/*.server.[jt]sx');

  // preloadPageQueries();
  // preloadTemplateQuery(serverState);

  return (
    <CartProvider>
      <DefaultSeo />
      <Switch>
        <DefaultRoutes
          pages={pages}
          serverState={serverState}
          fallback={<NotFound />}
        />
      </Switch>
    </CartProvider>
  );
}

function preloadTemplateQuery({pathname, country = {isoCode: 'US'}}) {
  if (pathname === '/') {
    preloadShopQuery({
      query: INDEX_QUERY,
      variables: {
        country: country.isoCode,
      },
    });
    preloadShopQuery({query: WELCOME_QUERY});
  } else if (/\/products\//.test(pathname)) {
    const {handle} = useParams();
    preloadShopQuery({
      query: PRODUCT_QUERY,
      variables: {
        country: country.isoCode,
        handle,
      },
    });
  }
}

const INDEX_QUERY = gql`
  query indexContent(
    $country: CountryCode
    $numCollections: Int = 2
    $numProducts: Int = 3
    $includeReferenceMetafieldDetails: Boolean = false
    $numProductMetafields: Int = 0
    $numProductVariants: Int = 250
    $numProductMedia: Int = 1
    $numProductVariantMetafields: Int = 10
    $numProductVariantSellingPlanAllocations: Int = 0
    $numProductSellingPlanGroups: Int = 0
    $numProductSellingPlans: Int = 0
  ) @inContext(country: $country) {
    collections(first: $numCollections) {
      edges {
        node {
          descriptionHtml
          description
          handle
          id
          title
          image {
            ...ImageFragment
          }
          products(first: $numProducts) {
            edges {
              node {
                ...ProductProviderFragment
              }
            }
          }
        }
      }
    }
  }

  ${ProductProviderFragment}
  ${Image.Fragment}
`;

const WELCOME_QUERY = gql`
  query welcomeContent {
    shop {
      name
    }
    products(first: 250) {
      edges {
        node {
          handle
        }
      }
    }
    collections(first: 250) {
      edges {
        node {
          handle
        }
      }
    }
  }
`;

const PRODUCT_QUERY = gql`
  query product(
    $country: CountryCode
    $handle: String!
    $includeReferenceMetafieldDetails: Boolean = true
    $numProductMetafields: Int = 20
    $numProductVariants: Int = 250
    $numProductMedia: Int = 6
    $numProductVariantMetafields: Int = 10
    $numProductVariantSellingPlanAllocations: Int = 0
    $numProductSellingPlanGroups: Int = 0
    $numProductSellingPlans: Int = 0
  ) @inContext(country: $country) {
    product: product(handle: $handle) {
      id
      vendor
      seo {
        title
        description
      }
      images(first: 1) {
        edges {
          node {
            url
          }
        }
      }
      ...ProductProviderFragment
    }
  }

  ${ProductProviderFragment}
`;
