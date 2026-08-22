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

function useStates(country?: string) {
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!country) {
      setStates([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setStates([]);

    (async () => {
      try {
        const res = await fetch(`${COUNTRIES_NOW}/states`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country }),
        });
        const data = await res.json();
        if (!cancelled && data?.data?.states) {
          setStates(data.data.states.map((s: any) => s.name));
        }
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

function useCities(country?: string, state?: string) {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!country || !state) {
      setCities([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setCities([]);

    (async () => {
      try {
        const res = await fetch(`${COUNTRIES_NOW}/state/cities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country, state }),
        });
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.data)) {
          setCities(data.data);
        }
      } catch (err) {
        console.error("Error fetching cities:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [country, state]);

  return { cities, loading };
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

export function CitySelect({
  id,
  country,
  state,
  value,
  onChange,
  disabled,
  placeholder = "Select a city",
}: FieldProps & { country?: string; state?: string }) {
  const { cities, loading } = useCities(country, state);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading cities…</p>;
  }

  if (cities.length === 0) {
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

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] bg-white border-gray-300">
        {cities.map((city) => (
          <SelectItem key={city} value={city} className={selectItemClass}>
            {city}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
