/* Runs before first paint: a return visit inside the site, or back/forward,
   skips the opening seam. Kept as a file (not inline) so the Content Security
   Policy can stay hash-free. */
try{var n=performance.getEntriesByType("navigation")[0],t=n?n.type:"navigate",r=document.referrer;if(t==="back_forward"||(t!=="reload"&&r&&new URL(r).origin===location.origin))document.documentElement.classList.add("no-intro");}catch(e){}
