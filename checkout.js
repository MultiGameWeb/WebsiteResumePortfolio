(() => {
  const state = Store.read();
  const template = getTemplate(state.templateId || "photography-01");
  document.getElementById("checkoutName").textContent = template?.name || "Website Template";
  document.getElementById("payBtn").addEventListener("click", () => {
    const btn = document.getElementById("payBtn");
    btn.disabled = true; btn.textContent = "Processing…";
    setTimeout(() => { Store.update({paid:true}); location.href = "success.html"; }, 850);
  });
})();