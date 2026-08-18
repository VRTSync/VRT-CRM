import { createContext, useContext } from "react";

// The customer record publishes the open customer here so the sidebar
// can render it as an indented sub-item under Customers.
export const OpenCustomerContext = createContext({
  openCustomer: null,
  setOpenCustomer: () => {},
});

export function useOpenCustomer() {
  return useContext(OpenCustomerContext);
}
