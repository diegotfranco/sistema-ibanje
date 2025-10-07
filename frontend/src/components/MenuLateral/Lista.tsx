type ListaProps = {
  children?: React.ReactNode;
};

export const Lista = ({ children }: ListaProps) => {
  return <div className="flex flex-col gap-2">{children}</div>;
};
