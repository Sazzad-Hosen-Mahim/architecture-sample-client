/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { countries } from "@/data/countries-states";

/**
 * Country / state / city pickers shared by the public New Project wizard, the
 * New Inquiry form and the New Proposal wizard, so all four ask for an address
 * the same way and produce the same spellings.
 *
 * States and cities come from the countriesnow.space API. When it has nothing
 * for the selection (or the request fails) each control degrades to a plain
 * text input rather than trapping the user with an empty dropdown.
 *
 * Clearing a stale state/city after the country changes is left to the caller,
 * so a prefilled form isn't wiped on first render.
 */

const COUNTRIES_NOW = "https://countriesnow.space/api/v0.1/countries";

const selectItemClass = "hover:bg-gray-800 hover:text-white cursor-pointer";

// Cache state lists by country so a form that re-mounts (e.g. stepping back to
// an earlier wizard step) shows the dropdown straight away instead of briefly
// degrading to a plain text input while the request is in flight.
const statesCache = new Map<string, string[]>();

function useStates(country?: string) {
  const [states, setStates] = useState<string[]>(
    () => (country && statesCache.get(country)) || [],
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!country) {
      setStates([]);
      return;
    }

    const cached = statesCache.get(country);
    if (cached) {
      setStates(cached);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setStates([]);

    (async () => {
      try {
        // GET ".../states/q?country=" rather than POST ".../states": upstream
        // now 301-redirects the POST to this query form, and a 301 turns the
        // request into a GET with the JSON body dropped — so `data.states` came
        // back undefined and the control sat on "Loading states..." forever.
        const res = await fetch(
          `${COUNTRIES_NOW}/states/q?country=${encodeURIComponent(country)}`,
        );
        const data = await res.json();
        const names: string[] =
          data?.data?.states?.map((s: any) => s.name) ?? [];
        statesCache.set(country, names);
        if (!cancelled) setStates(names);
      } catch (err) {
        console.error("Error fetching states:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [country]);

  return { states, loading };
}

interface FieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function CountrySelect({
  id,
  value,
  onChange,
  disabled,
  placeholder = "Select country",
}: FieldProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] bg-white border-gray-300">
        {countries.map((country) => (
          <SelectItem
            key={country.code}
            value={country.name}
            className={selectItemClass}
          >
            {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function StateSelect({
  id,
  country,
  value,
  onChange,
  disabled,
  placeholder = "Select a state",
}: FieldProps & { country?: string }) {
  const { states, loading } = useStates(country);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading states…</p>;
  }

  if (states.length === 0) {
    return (
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter state or province"
        disabled={disabled}
      />
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] bg-white border-gray-300">
        {states.map((state) => (
          <SelectItem key={state} value={state} className={selectItemClass}>
            {state}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// City is a free-text input everywhere — the city API list is noisy and often
// missing smaller places, and a plain field is faster for the client.
export function CitySelect({
  id,
  value,
  onChange,
  disabled,
}: FieldProps & { country?: string; state?: string }) {
  return (
    <Input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter city"
      disabled={disabled}
    />
  );
}
