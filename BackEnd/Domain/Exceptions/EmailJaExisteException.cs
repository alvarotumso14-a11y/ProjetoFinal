using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Exceptions
{
    public class EmailJaExisteException : Exception
    {
        public EmailJaExisteException()
            : base("Já existe um usuário cadastrado com este e-mail.")
        {
        }
    }
}