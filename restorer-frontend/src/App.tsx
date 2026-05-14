import { useState } from "react";

function App() {
    const [count, setCount] = useState(0);

    return (
        <>
            <section id="center">
                <h2>restorer</h2>
                <button
                    type="button"
                    className="counter"
                    onClick={() => setCount((count) => count + 1)}
                >
                    Count is {count}
                </button>
            </section>
        </>
    );
}

export default App;
