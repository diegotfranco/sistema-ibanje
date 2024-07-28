import { useRouteError } from "react-router-dom";

const Error = () => {
  const error: any = useRouteError();

  return (
    <>
      <p>pagina erro</p>
      <p>
        {error.internal
          ? `${error.status} - ${error.statusText}`
          : error.message}
      </p>
    </>
  );
};

export default Error;
