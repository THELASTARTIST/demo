with open("styles/landing.css","r") as f: c=f.read()
with open("styles/landing.css","w") as f: f.write(c.replace("/* Mobile */", "@keyframes shimmerText{0%,100%{text-shadow:0 0 15px rgba(0,200,255,.35),0 0 30px rgba(0,200,255,.15)}50%{text-shadow:0 0 25px rgba(0,200,255,.55),0 0 60px rgba(0,200,255,.3)}}\n.landing-page .hero-title em{text-shadow:0 0 20px rgba(0,200,255,.4),0 0 50px rgba(0,200,255,.2);animation:shimmerText 3s infinite alternate}\n/* Mobile */"))
print("updated")
