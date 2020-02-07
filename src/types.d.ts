/// <reference types="@types/node" />
/// <reference types="@types/react" />
/// <reference types="@types/react-dom" />
/// <reference types="@types/react-router" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly PUBLIC_URL: string;
  }
}

declare module '*.bmp' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;

  const src: string;
  export default src;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { [key: string]: string };
  export default classes;
}

interface NodeModule {
  hot: any;
}

interface AuthorizeRouteConfigComponentProps<Params extends { [K in keyof Params]?: string } = {}>
  extends RouteComponentProps<Params> {
  route?: AuthorizeRouteConfig;
}

interface AuthorizeProps {
  isAuthenticated?: boolean;
  restricted?: boolean;
}

interface ExtraProps {
  authorize?: AuthorizeProps;
  [propName: string]: any;
}

interface AuthorizeRouteConfig {
  authorize?: AuthorizeProps;
  key?: React.Key;
  location?: Location;
  component?: React.ComponentType<AuthorizeRouteConfigComponentProps<any>> | React.ComponentType;
  path?: string | string[];
  exact?: boolean;
  strict?: boolean;
  routes?: AuthorizeRouteConfig[];
  render?: (props: AuthorizeRouteConfigComponentProps<any>) => React.ReactNode;
  [propName: string]: any;
}

type AuthorizeAreaProps = {
  routes?: AuthorizeRouteConfig[];
  extraProps?: ExtraProps;
  switchProps?: any;
};
