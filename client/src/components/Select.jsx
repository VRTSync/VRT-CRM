import { forwardRef } from "react";

const Select = forwardRef(function Select(
  { children, className = "", wrapperClassName = "", ...props },
  ref
) {
  return (
    <span className={`select-control ${wrapperClassName}`.trim()}>
      <select
        {...props}
        ref={ref}
        className={`select-native ${className}`.trim()}
      >
        {children}
      </select>
    </span>
  );
});

export default Select;