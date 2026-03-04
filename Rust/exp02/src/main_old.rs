use rust_decimal::prelude::*;
use rust_decimal_macros::dec;
use num_bigint::BigInt;

fn main() {
    let a = Decimal::new(42345,2);
    let b = Decimal::new(876,2);
    let c = a / b;
    let d = dec!(123.45) + dec!(0.876);
    println!("c: {} d:{}" , c, d);

    let p = BigInt::from(93323);
    let q = BigInt::from(93971);
    let n = &p * &q;
    let phi = (&p - 1) * (&q - 1);
    println!("n: {} phi: {}", n, phi);

    let e = BigInt::from(65537);
    let d = e.modinv(&phi).unwrap();
    println!("e {} {} d {} {}", e, n, d, n);

    let m = BigInt::from(87689);
    let c = m.modpow(&e, &n);
    println!("m {} c {} ", m, c);

    let m2 = c.modpow(&d, &n);
    println!("original {} m2 {} ", m, m2);
}
