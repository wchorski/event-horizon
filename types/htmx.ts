// htmx.ts

declare namespace Htmx {
  interface AfterSwapDetail {
    elt: HTMLElement;
    target: HTMLElement;
    requestConfig: object;
    successful: boolean;
  }

  interface AfterRequestDetail {
    xhr: XMLHttpRequest;
    elt: HTMLElement;
    target: Element | null;
    requestConfig: object;
    successful: boolean;
    failed: boolean;
  }

  interface ResponseErrorDetail {
    xhr: XMLHttpRequest;
    target: Element;
    requestConfig: any;
    etc: any;
    pathInfo: any;
    elt: Element;
  }

  interface HtmxAfterSwapEvent extends CustomEvent<AfterSwapDetail> {}
  interface HtmxAfterRequestEvent extends CustomEvent<AfterRequestDetail> {}
  interface HtmxResponseErrorEvent extends CustomEvent<ResponseErrorDetail> {}
}

declare global {
  interface HTMLElementEventMap {
    "htmx:afterSwap": Htmx.HtmxAfterSwapEvent;
    "htmx:afterRequest": Htmx.HtmxAfterRequestEvent;
  }

  interface DocumentEventMap {
    "htmx:responseError": Htmx.HtmxResponseErrorEvent;
  }
}

export {};
