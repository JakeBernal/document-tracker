import "../css/howitworks.css"
export default function howitworks() {
    const steps = [
    "Submit Request",
    "Verification",
    "Processing",
    "Release",
  ];  
  return (
     <section className="how">

      <h2>How it works</h2>
      <div className="steps">
        {steps.map((step, i) => (
          <div key={i}>
            <span>{i + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
