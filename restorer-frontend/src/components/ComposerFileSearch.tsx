import { Button } from "@guardian/stand/Button";
import { TextInput } from "@guardian/stand/TextInput";
import { useState } from "react";

interface Props {
    submit: { (input: string): void };
    errorMessage?: string;
}

export const ComposerFileSearch = ({ submit, errorMessage }: Props) => {
    const [input, setInput] = useState("");

    return (
        <section
            style={{
                minHeight: 300,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 10,
                }}
            >
                <div
                    style={{
                        minHeight: 100,
                    }}
                >
                    <TextInput
                        label="Enter a composer url:"
                        value={input}
                        onChange={setInput}
                        error={errorMessage}
                        isInvalid={!!errorMessage}
                    />
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    <Button
                        onClick={() => submit(input)}
                        isDisabled={input.length === 0}
                    >
                        Search
                    </Button>
                </div>
            </div>
        </section>
    );
};
