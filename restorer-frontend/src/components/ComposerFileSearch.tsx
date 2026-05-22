import { css } from "@emotion/react";
import { Button } from "@guardian/stand/Button";
import { TextInput } from "@guardian/stand/TextInput";
import { useState } from "react";

interface Props {
    submit: { (input: string): void };
}

export const ComposerFileSearch = ({ submit }: Props) => {
    const [input, setInput] = useState("");

    return (
        <section
            style={{
                minHeight: 200,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                }}
            >
                <span>Enter a composer url:</span>
                <TextInput
                    aria-label="Enter a composer url:"
                    value={input}
                    onChange={setInput}
                    cssOverrides={css({
                        flexDirection: "row",
                        alignItems: "center",
                        width: "unset",
                        input: {
                            margin: 0,
                        },
                    })}
                />
                <Button
                    onClick={() => submit(input)}
                    isDisabled={input.length === 0}
                >
                    Search
                </Button>
            </div>
        </section>
    );
};
