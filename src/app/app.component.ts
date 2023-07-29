import { Component } from '@angular/core';
import { Counter } from 'src/contracts/counter';
import { Scrypt, ContractCalledEvent, SensiletSigner, ScryptProvider } from 'scrypt-ts';

const contractId = {
  txId: 'fdc5218259b0d8b2127873537339d58b7c8c1e19f0859b6bc3d3549d48d64a3c',
  outputIndex: 0,
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  instance: Counter | null = null
  signer: SensiletSigner = new SensiletSigner(new ScryptProvider())

  ngOnInit() {
    this.fetchInstance()
    Scrypt.contractApi.subscribe({
      clazz: Counter,
      id: contractId,
    }, (event: ContractCalledEvent<Counter>) => {
      const txId = event.tx.id
      console.log(`Counter increment: ${txId}`)
      this.instance = event.nexts[0]
    })
  }

  async fetchInstance() {
    try {
      this.instance = await Scrypt.contractApi.getLatestInstance(Counter, contractId)
    } catch (e: any) {
      console.log(`Fetch instance error: ${e}`)
    }
  }

  async increment() {
    if (this.instance !== null) {
      const { isAuthenticated, error } = await this.signer.requestAuth()
      if (!isAuthenticated) {
        throw new Error(error)
      }
      await this.instance.connect(this.signer)

      const nextInstance = this.instance.next()
      nextInstance.count++

      this.instance.methods['increment']({
        next: {
          instance: nextInstance,
          balance: this.instance.balance
        }
      }).catch(e => {
        console.log(`Counter call error: ${e}`)
        this.fetchInstance()
      })
    }
  }
}
