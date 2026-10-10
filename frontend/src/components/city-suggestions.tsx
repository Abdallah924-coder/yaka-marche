const priorityCities = ["Brazzaville", "Pointe-Noire"];

export default function CitySuggestions({ id }: { id: string }) {
  return (
    <datalist id={id}>
      {priorityCities.map((city) => <option key={city} value={city} />)}
    </datalist>
  );
}
