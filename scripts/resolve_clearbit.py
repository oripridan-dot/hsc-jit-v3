import dns.resolver

def get_ip(host):
    try:
        resolver = dns.resolver.Resolver()
        resolver.nameservers = ['8.8.8.8', '1.1.1.1'] # Use Google or Cloudflare
        try:
            answers = resolver.resolve(host, 'A')
            for rdata in answers:
                print(f"A: {rdata.address}")
        except:
            print("No A record found directly.")
            
        try:
            answers = resolver.resolve(host, 'CNAME')
            for rdata in answers:
                print(f"CNAME: {rdata.target}")
        except Exception as e:
            print(f"CNAME Error: {e}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_ip("logo.clearbit.com")
