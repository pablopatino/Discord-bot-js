require('dotenv').config();
const {REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
    {
        name: 'subasta',
        description: 'Replies',
        options: [
            {
                name: 'id_del_item',
                description: 'Id del item a subastar',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'core',
                description: 'Es item para core?',
                type: ApplicationCommandOptionType.Boolean,
                required: true
            }
        ]
    },
    {
        name: 'pujar',
        description: 'Pujar por un item',
        options: [
            {
                name: 'valor_a_pujar',
                description: 'Dks que quieras pujar',
                type: ApplicationCommandOptionType.Integer,
                required: true,
            },
        ]
    },
    {
        name: 'terminar',
        description: 'Termina la subasta',
    },
    {
        name: 'otorgar', //SOLO PUEDO DAR PUNTOS YO.
        description: 'Otorgar puntos a todos',
        options: [
            {
                name: 'puntos', 
                description: 'Puntos a otorgarles a todos   ',
                type: ApplicationCommandOptionType.Integer,
                required: true,
            },
        ]
    },
    {
        name: 'registrarse', 
        description: 'Registrarse en la aplicacion para participar',
        options: [
            {
                name: 'nombre', 
                description: 'Pon tu nombre de simepre, ejm: Kougra, Toph, Tskk',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ]
    },
    {
        name: 'registrar_personajes', 
        description: 'Registrar cada uno de tus personajes',
        options: [
            {
                name: 'nombre_del_personaje', 
                description: 'Nombre de los personajes que aparecen en raiderio',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ]
    },
    {
        name: 'loguearse', 
        description: 'Loguearse en la session actual.'
    },
    {
        name: 'puntos', 
        description: 'Los puntos que tienes ahora mismo'
    },
    {
        name: 'puntos_globales', 
        description: 'Lista de puntos de la URSS'
    },
    {
        name: 'prueba', 
        description: 'prueba'
    },
    {
        name: 'tradear_puntos', 
        description: 'Darle puntos a una persona',
        options: [
            {
                name: 'puntos', 
                description: 'Pon tu nombre de simepre, ejm: Kougra, Toph, Tskk',
                type: ApplicationCommandOptionType.Integer,
                required: true,
            },
            {
                name: 'usuario', 
                description: 'usuario',
                type: ApplicationCommandOptionType.User,
                required: true,
            },
        ]
    },
    
];

const rest = new REST({ version: '10'}).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Registro de commandos....')

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        )
        
        console.log('Comandos exitoso....')

    } catch (error) {
        console.log(error);
    }
})();